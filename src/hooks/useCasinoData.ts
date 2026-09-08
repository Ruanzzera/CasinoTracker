import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CasinoEntry, Statistics, EntryType } from '@/types/casino';
import type { AccountName } from '@/types/casino';
import { nowBRT, toBRT, todayStartBRT, monthStartBRT, yearStartBRT } from '@/lib/timezone';
import { normalizeHouseName, findExistingHouse, findExistingGame } from '@/hooks/useSharedLibrary';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

// Cache de sessão das entradas: evita reler a tabela inteira a cada
// navegação entre Dashboard e Análises.
const entriesCache: { data: CasinoEntry[]; fetchedAt: number } = { data: [], fetchedAt: 0 };
const ENTRIES_TTL_MS = 10 * 60 * 1000;

type DashboardSummary = {
  totalProfit: number; dailyTotal: number; monthlyTotal: number; yearlyTotal: number;
  entriesCount: number;
  bestType: { type: EntryType; total: number } | null;
  bestHouse: { house: string; total: number } | null;
  bestGame: { game: string; total: number } | null;
  bestHour: { hour: number; total: number } | null;
};

export function useCasinoData(opts?: { libraryHouses?: string[]; libraryGames?: string[] }) {
  const [entries, setEntries] = useState<CasinoEntry[]>(entriesCache.data);
  const [houses, setHouses] = useState<string[]>([]);
  const [games, setGames] = useState<string[]>([]);
  const [loading, setLoading] = useState(entriesCache.fetchedAt === 0);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const libHouses = opts?.libraryHouses ?? [];
  const libGames = opts?.libraryGames ?? [];
  const { user } = useAuth();

  const applyEntries = useCallback((formattedEntries: CasinoEntry[]) => {
    setEntries(formattedEntries);
    const uniqueHouses = [...new Set(formattedEntries.map(e => e.house))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const uniqueGames = [...new Set(formattedEntries.map(e => e.game))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    setHouses(uniqueHouses);
    setGames(uniqueGames);
  }, []);

  const fetchEntries = useCallback(async (force = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (!force && entriesCache.fetchedAt > 0 && Date.now() - entriesCache.fetchedAt < ENTRIES_TTL_MS) {
      applyEntries(entriesCache.data);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('casino_entries')
      .select('id, amount, type, house, game, notes, account, created_at')
      .order('created_at', { ascending: false });


    if (error) {
      console.error('Error fetching entries:', error?.message);
      toast.error('Erro ao carregar entradas');
      setLoading(false);
      return;
    }

    const formattedEntries: CasinoEntry[] = (data || []).map(e => ({
      id: e.id,
      amount: Number(e.amount),
      type: e.type as EntryType,
      house: e.house,
      game: e.game,
      notes: e.notes || undefined,
      account: ((e as { account?: string }).account === 'Rita' ? 'Rita' : 'Ruan') as AccountName,
      createdAt: new Date(e.created_at),
    })).filter(e => e.type !== 'torneio'); // Torneios têm montante próprio na página Torneios

    entriesCache.data = formattedEntries;
    entriesCache.fetchedAt = Date.now();
    applyEntries(formattedEntries);
    setLoading(false);
  }, [user, applyEntries]);

  // Resumo agregado calculado no banco (RLS aplicada: SECURITY INVOKER).
  const fetchSummary = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.rpc('dashboard_summary');
    if (error) {
      console.error('Error fetching summary:', error?.message);
      return;
    }
    const raw = data as Record<string, unknown> | null;
    if (!raw) return;
    const num = (v: unknown) => Number(v ?? 0);
    setSummary({
      totalProfit: num(raw.totalProfit),
      dailyTotal: num(raw.dailyTotal),
      monthlyTotal: num(raw.monthlyTotal),
      yearlyTotal: num(raw.yearlyTotal),
      entriesCount: num(raw.entriesCount),
      bestType: (raw.bestType as DashboardSummary['bestType']) ?? null,
      bestHouse: (raw.bestHouse as DashboardSummary['bestHouse']) ?? null,
      bestGame: (raw.bestGame as DashboardSummary['bestGame']) ?? null,
      bestHour: (raw.bestHour as DashboardSummary['bestHour']) ?? null,
    });
  }, [user]);

  useEffect(() => {
    fetchEntries();
    fetchSummary();
  }, [fetchEntries, fetchSummary]);


  const addEntry = useCallback(async (
    entry: Omit<CasinoEntry, 'id' | 'createdAt'>,
    options?: { dailyGoalReached?: boolean; onTipJar?: (remainder: number, sourceId: string) => void }
  ) => {
    if (!user) return;

    // Match against shared library (all tables) to evitar duplicidade por caixa/acentos/espaços
    const allHouses = [...new Set([...libHouses, ...houses])];
    const allGames = [...new Set([...libGames, ...games])];
    const resolvedHouse = findExistingHouse(entry.house, allHouses) || normalizeHouseName(entry.house);
    const resolvedGame = findExistingGame(entry.game, allGames) || entry.game.trim();

    // Tip Jar split: round DOWN to nearest 0.50 when daily goal already reached
    let savedAmount = entry.amount;
    let remainder = 0;
    if (options?.dailyGoalReached && entry.amount > 0) {
      savedAmount = Math.floor(entry.amount / 0.5) * 0.5;
      remainder = parseFloat((entry.amount - savedAmount).toFixed(2));
      // If the value is already a multiple of 0.50 (e.g. 2.50), remainder is 0 — no split needed
    }

    const { data, error } = await supabase
      .from('casino_entries')
      .insert({
        user_id: user.id,
        amount: savedAmount,
        type: entry.type,
        house: resolvedHouse,
        game: resolvedGame,
        notes: entry.notes || null,
        account: entry.account || 'Ruan',
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding entry:', error?.message);
      toast.error('Erro ao adicionar entrada');
      return;
    }

    const newEntry: CasinoEntry = {
      id: data.id,
      amount: Number(data.amount),
      type: data.type as EntryType,
      house: data.house,
      game: data.game,
      notes: data.notes || undefined,
      account: ((data as { account?: string }).account === 'Rita' ? 'Rita' : 'Ruan') as AccountName,
      createdAt: new Date(data.created_at),
    };

    setEntries(prev => {
      const next = [newEntry, ...prev];
      entriesCache.data = next;
      return next;
    });
    // Atualização otimista do resumo (sem reler a tabela nem chamar a RPC).
    setSummary(prev => prev ? {
      ...prev,
      totalProfit: prev.totalProfit + newEntry.amount,
      dailyTotal: prev.dailyTotal + newEntry.amount,
      monthlyTotal: prev.monthlyTotal + newEntry.amount,
      yearlyTotal: prev.yearlyTotal + newEntry.amount,
      entriesCount: prev.entriesCount + 1,
    } : prev);


    if (!houses.includes(resolvedHouse)) {
      setHouses(prev => [...prev, resolvedHouse].sort((a, b) => a.localeCompare(b, 'pt-BR')));
    }
    if (!games.includes(resolvedGame)) {
      setGames(prev => [...prev, resolvedGame].sort((a, b) => a.localeCompare(b, 'pt-BR')));
    }

    // Send remainder to Tip Jar
    if (remainder > 0 && options?.onTipJar) {
      options.onTipJar(remainder, data.id);
    }

    return { savedAmount, remainder };
  }, [houses, games, user, libHouses, libGames]);

  const updateEntry = useCallback(async (id: string, updates: Partial<Omit<CasinoEntry, 'id'>> & { createdAt?: string }) => {
    const updateData: Record<string, unknown> = {};
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.type !== undefined) updateData.type = updates.type;
    const allHouses = [...new Set([...libHouses, ...houses])];
    const allGames = [...new Set([...libGames, ...games])];
    if (updates.house !== undefined) {
      updateData.house = findExistingHouse(updates.house, allHouses) || normalizeHouseName(updates.house);
    }
    if (updates.game !== undefined) {
      updateData.game = findExistingGame(updates.game, allGames) || updates.game.trim();
    }
    if (updates.notes !== undefined) updateData.notes = updates.notes || null;
    if ((updates as { account?: AccountName }).account !== undefined) updateData.account = (updates as { account?: AccountName }).account;
    if (updates.createdAt !== undefined) updateData.created_at = updates.createdAt;

    const { data, error } = await supabase
      .from('casino_entries')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating entry:', error?.message);
      toast.error('Erro ao atualizar entrada');
      return false;
    }

    setEntries(prev => {
      const next = prev.map(e => e.id === id ? {
        ...e,
        amount: Number(data.amount),
        type: data.type as EntryType,
        house: data.house,
        game: data.game,
        notes: data.notes || undefined,
        account: ((data as { account?: string }).account === 'Rita' ? 'Rita' : 'Ruan') as AccountName,
        createdAt: new Date(data.created_at),
      } : e);
      entriesCache.data = next;
      return next;
    });
    fetchSummary();

    return true;
  }, [houses, games, libHouses, libGames, fetchSummary]);

  const deleteEntry = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('casino_entries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting entry:', error?.message);
      toast.error('Erro ao remover entrada');
      return;
    }

    setEntries(prev => {
      const next = prev.filter(e => e.id !== id);
      entriesCache.data = next;
      return next;
    });
    fetchSummary();
  }, [fetchSummary]);


  const statistics = useMemo<Statistics>(() => {
    const todayStart = todayStartBRT();
    const monthStart = monthStartBRT();
    const yearStart = yearStartBRT();

    const totalProfit = entries.reduce((sum, e) => sum + e.amount, 0);
    const dailyTotal = entries
      .filter(e => toBRT(e.createdAt) >= todayStart)
      .reduce((sum, e) => sum + e.amount, 0);
    const monthlyTotal = entries
      .filter(e => toBRT(e.createdAt) >= monthStart)
      .reduce((sum, e) => sum + e.amount, 0);
    const yearlyTotal = entries
      .filter(e => toBRT(e.createdAt) >= yearStart)
      .reduce((sum, e) => sum + e.amount, 0);

    const typeMap = new Map<EntryType, number>();
    entries.forEach(e => {
      typeMap.set(e.type, (typeMap.get(e.type) || 0) + e.amount);
    });
    let bestType: { type: EntryType; total: number } | null = null;
    typeMap.forEach((total, type) => {
      if (!bestType || total > bestType.total) {
        bestType = { type, total };
      }
    });

    const houseMap = new Map<string, number>();
    entries.forEach(e => {
      houseMap.set(e.house, (houseMap.get(e.house) || 0) + e.amount);
    });
    let bestHouse: { house: string; total: number } | null = null;
    houseMap.forEach((total, house) => {
      if (!bestHouse || total > bestHouse.total) {
        bestHouse = { house, total };
      }
    });

    const gameMap = new Map<string, number>();
    entries.forEach(e => {
      gameMap.set(e.game, (gameMap.get(e.game) || 0) + e.amount);
    });
    let bestGame: { game: string; total: number } | null = null;
    gameMap.forEach((total, game) => {
      if (!bestGame || total > bestGame.total) {
        bestGame = { game, total };
      }
    });

    const hourMap = new Map<number, number>();
    entries.forEach(e => {
      const hour = toBRT(e.createdAt).getHours();
      hourMap.set(hour, (hourMap.get(hour) || 0) + e.amount);
    });
    let bestHour: { hour: number; total: number } | null = null;
    hourMap.forEach((total, hour) => {
      if (!bestHour || total > bestHour.total) {
        bestHour = { hour, total };
      }
    });

    const highestEntry = entries.length > 0
      ? entries.reduce((max, e) => e.amount > max.amount ? e : max, entries[0])
      : null;

    return {
      totalProfit,
      dailyTotal,
      monthlyTotal,
      yearlyTotal,
      bestType,
      bestHouse,
      bestGame,
      bestHour,
      highestEntry,
      entriesCount: entries.length,
    };
  }, [entries]);

  const chartData = useMemo(() => {
    const byType = new Map<EntryType, number>();
    entries.forEach(e => {
      byType.set(e.type, (byType.get(e.type) || 0) + e.amount);
    });

    const byHouse = new Map<string, number>();
    entries.forEach(e => {
      byHouse.set(e.house, (byHouse.get(e.house) || 0) + e.amount);
    });

    const byGame = new Map<string, number>();
    entries.forEach(e => {
      byGame.set(e.game, (byGame.get(e.game) || 0) + e.amount);
    });

    const last7Days: { date: string; total: number }[] = [];
    const now = nowBRT();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      
      const total = entries
        .filter(e => {
          const entryDate = toBRT(e.createdAt);
          return entryDate >= dayStart && entryDate < dayEnd;
        })
        .reduce((sum, e) => sum + e.amount, 0);
      
      last7Days.push({ date: dateStr, total });
    }

    return {
      byType: Array.from(byType.entries()).map(([type, value]) => ({ name: type, value })),
      byHouse: Array.from(byHouse.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      byGame: Array.from(byGame.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      last7Days,
    };
  }, [entries]);

  // Backwards-compatible function wrappers; pass entries to compute over a filtered subset.
  const calculateStatistics = useCallback((source?: CasinoEntry[]): Statistics => {
    if (!source) return statistics;
    const todayStart = todayStartBRT();
    const monthStart = monthStartBRT();
    const yearStart = yearStartBRT();
    const totalProfit = source.reduce((s, e) => s + e.amount, 0);
    const dailyTotal = source.filter(e => toBRT(e.createdAt) >= todayStart).reduce((s, e) => s + e.amount, 0);
    const monthlyTotal = source.filter(e => toBRT(e.createdAt) >= monthStart).reduce((s, e) => s + e.amount, 0);
    const yearlyTotal = source.filter(e => toBRT(e.createdAt) >= yearStart).reduce((s, e) => s + e.amount, 0);
    const tMap = new Map<EntryType, number>();
    const hMap = new Map<string, number>();
    const gMap = new Map<string, number>();
    const hourMap = new Map<number, number>();
    source.forEach(e => {
      tMap.set(e.type, (tMap.get(e.type) || 0) + e.amount);
      hMap.set(e.house, (hMap.get(e.house) || 0) + e.amount);
      gMap.set(e.game, (gMap.get(e.game) || 0) + e.amount);
      const hour = toBRT(e.createdAt).getHours();
      hourMap.set(hour, (hourMap.get(hour) || 0) + e.amount);
    });
    const pickMax = <K, V extends { total: number }>(m: Map<K, number>, build: (k: K, total: number) => V): V | null => {
      let best: V | null = null;
      m.forEach((total, k) => { if (!best || total > best.total) best = build(k, total); });
      return best;
    };
    return {
      totalProfit, dailyTotal, monthlyTotal, yearlyTotal,
      bestType: pickMax(tMap, (type, total) => ({ type, total })),
      bestHouse: pickMax(hMap, (house, total) => ({ house, total })),
      bestGame: pickMax(gMap, (game, total) => ({ game, total })),
      bestHour: pickMax(hourMap, (hour, total) => ({ hour, total })),
      highestEntry: source.length > 0 ? source.reduce((max, e) => e.amount > max.amount ? e : max, source[0]) : null,
      entriesCount: source.length,
    };
  }, [statistics]);
  const getChartData = useCallback(() => chartData, [chartData]);

  // Resumo do painel vindo do banco (agregado em SQL). Enquanto ele não chega,
  // ou se falhar, usamos o cálculo antigo feito no navegador (`statistics`).
  const summaryStatistics = useMemo<Statistics>(() => {
    if (!summary) return statistics;
    return {
      totalProfit: summary.totalProfit,
      dailyTotal: summary.dailyTotal,
      monthlyTotal: summary.monthlyTotal,
      yearlyTotal: summary.yearlyTotal,
      bestType: summary.bestType,
      bestHouse: summary.bestHouse,
      bestGame: summary.bestGame,
      bestHour: summary.bestHour,
      highestEntry: statistics.highestEntry,
      entriesCount: summary.entriesCount,
    };
  }, [summary, statistics]);

  return {
    entries,
    houses,
    games,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    // CÓDIGO ANTIGO (mantido): cálculo 100% no navegador.
    // statistics,
    statistics: summaryStatistics,
    statisticsLocal: statistics,
    chartData,
    calculateStatistics,
    getChartData,
    refresh: fetchEntries,
  };

}
