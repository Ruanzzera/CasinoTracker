import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { normalizeHouseName, findExistingHouse, findExistingGame } from './useSharedLibrary';
import { toast } from 'sonner';
import { todayBRT, brtDateTimeToISO } from '@/lib/timezone';
import { useAuth } from '@/hooks/useAuth';
import { runModel, blendRtp, type Volatility, type ModelOutput } from '@/lib/betAndWinModel';


export interface BetAndWinEntry {
  id: string;
  userId: string;
  entryDate: string;
  entryTime: string;
  house: string;
  rolloverGame: string;
  prizeGame: string;
  betValue: number;
  requiredBets: number;
  initialBankroll: number;
  finalBankroll: number;
  spinCount: number;
  spinBet: number;
  spinPrize: number;
  finalizedMonth: string | null;
  casinoEntryId: string | null;
  createdAt: string;
  account: string[];
}

export interface SimulationParams {
  house: string;
  deposit: number;
  requiredRollover: number;
  spinCount: number;
  spinBet: number;
  prizeGame: string;
  rolloverRtp?: number; // 0..1 (informado)
  prizeRtp?: number; // 0..1 (informado)
  prizeVolatility?: Volatility;
}

export interface SimulationResult {
  avgRolloverLoss: number;
  expectedSpinReturn: number;
  maxRolloverLoss: number;
  recoveryProbability: number;
  verdict: 'viable' | 'marginal' | 'inviable' | 'no_data';
  houseSamples: number;
  gameSamples: number;
  // modelo RTP
  model: ModelOutput;
  rolloverRtpUsed: number;
  prizeRtpUsed: number;
  rolloverRtpObserved: number | null;
  prizeRtpObserved: number | null;
}

export interface RecommendParams {
  house: string;
  targetRollover: number;
  spinCount: number;
  spinBet: number;
  rolloverRtp?: number;
  prizeRtp?: number;
  prizeVolatility?: Volatility;
}

export interface RolloverRecommendation {
  rolloverGame: string;
  prizeGame: string;
  expectedProfit: number;
  expectedCost: number;
  evPrize: number;
  evPrizePessimistic: number;
  profitProbability: number;
  rtpObserved: number;
  samples: number;
  spinRatio: number;
  verdict: 'viable' | 'marginal' | 'inviable';
}

export interface RecommendResult {
  recommendations: RolloverRecommendation[];
  mostConsistent: { game: string; rtpObserved: number; samples: number } | null;
}


export function useBetAndWin(opts?: { libraryHouses?: string[]; libraryGames?: string[] }) {
  const [entries, setEntries] = useState<BetAndWinEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [houses, setHouses] = useState<string[]>([]);
  const [games, setGames] = useState<string[]>([]);
  const libHouses = opts?.libraryHouses ?? [];
  const libGames = opts?.libraryGames ?? [];
  const { user } = useAuth();

  const mapRow = (row: any): BetAndWinEntry => ({
    id: row.id,
    userId: row.user_id,
    entryDate: row.entry_date,
    entryTime: row.entry_time || '12:00',
    house: row.house,
    rolloverGame: row.game,
    prizeGame: row.prize_game,
    betValue: Number(row.bet_value),
    requiredBets: Number(row.required_bets),
    initialBankroll: Number(row.initial_bankroll),
    finalBankroll: Number(row.final_bankroll),
    spinCount: Number(row.spin_count),
    spinBet: Number(row.spin_bet),
    spinPrize: Number(row.spin_prize),
    finalizedMonth: row.finalized_month,
    casinoEntryId: row.casino_entry_id || null,
    createdAt: row.created_at,
    account: Array.isArray(row.account) ? row.account : ['Ruan'],
  });

  const fetchEntries = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('bet_and_win_entries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bet_and_win entries:', error?.message);
      return;
    }

    const mapped: BetAndWinEntry[] = (data || []).map(mapRow);

    setEntries(mapped);
    const uniqueHouses = [...new Set(mapped.map(e => e.house))];
    setHouses(uniqueHouses);
    const uniqueGames = [...new Set(mapped.flatMap(e => [e.rolloverGame, e.prizeGame]).filter(Boolean))];
    setGames(uniqueGames);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const addEntry = async (entry: {
    entryDate: string; entryTime: string; house: string; rolloverGame: string; prizeGame: string;
    betValue: number; requiredBets: number; initialBankroll: number; finalBankroll: number;
    spinCount: number; spinBet: number; spinPrize: number; account?: string[];
  }) => {
    if (!user) return;

    const allHouses = [...new Set([...libHouses, ...houses])];
    const allGames = [...new Set([...libGames, ...games])];
    const existingHouse = findExistingHouse(entry.house, allHouses);
    const finalHouse = existingHouse || normalizeHouseName(entry.house);
    const finalRollover = entry.rolloverGame ? (findExistingGame(entry.rolloverGame, allGames) || entry.rolloverGame.trim()) : '';
    const finalPrize = entry.prizeGame ? (findExistingGame(entry.prizeGame, allGames) || entry.prizeGame.trim()) : '';
    const account = entry.account && entry.account.length > 0 ? entry.account : ['Ruan'];

    const isoCreated = brtDateTimeToISO(entry.entryDate, entry.entryTime);
    const { data: inserted, error } = await supabase.rpc('bet_and_win_create', {
      p_entry_date: entry.entryDate,
      p_entry_time: entry.entryTime,
      p_house: finalHouse,
      p_rollover_game: finalRollover,
      p_prize_game: finalPrize,
      p_bet_value: entry.betValue,
      p_required_bets: entry.requiredBets,
      p_initial_bankroll: entry.initialBankroll,
      p_final_bankroll: entry.finalBankroll,
      p_spin_count: entry.spinCount,
      p_spin_bet: entry.spinBet,
      p_spin_prize: entry.spinPrize,
      p_created_at: isoCreated,
      p_account: account,
    });

    if (error) {
      toast.error('Erro ao adicionar entrada');
      return;
    }
    toast.success('Entrada adicionada!');
    if (inserted) {
      const row = mapRow(inserted);
      setEntries(prev => [row, ...prev]);
      setHouses(prev => prev.includes(row.house) ? prev : [...prev, row.house]);
      setGames(prev => {
        const next = [...prev];
        if (row.rolloverGame && !next.includes(row.rolloverGame)) next.push(row.rolloverGame);
        if (row.prizeGame && !next.includes(row.prizeGame)) next.push(row.prizeGame);
        return next;
      });
    }
  };
  const updateEntry = async (id: string, entry: {
    entryDate: string; entryTime: string; house: string; rolloverGame: string; prizeGame: string;
    betValue: number; requiredBets: number; initialBankroll: number; finalBankroll: number;
    spinCount: number; spinBet: number; spinPrize: number; account?: string[];
  }) => {
    const allHouses = [...new Set([...libHouses, ...houses])];
    const allGames = [...new Set([...libGames, ...games])];
    const existingHouse = findExistingHouse(entry.house, allHouses);
    const finalHouse = existingHouse || normalizeHouseName(entry.house);
    const finalRollover = entry.rolloverGame ? (findExistingGame(entry.rolloverGame, allGames) || entry.rolloverGame.trim()) : '';
    const finalPrize = entry.prizeGame ? (findExistingGame(entry.prizeGame, allGames) || entry.prizeGame.trim()) : '';
    const account = entry.account && entry.account.length > 0 ? entry.account : ['Ruan'];

    const isoCreated = brtDateTimeToISO(entry.entryDate, entry.entryTime);
    const { data: updated, error } = await supabase.rpc('bet_and_win_update', {
      p_id: id,
      p_entry_date: entry.entryDate,
      p_entry_time: entry.entryTime,
      p_house: finalHouse,
      p_rollover_game: finalRollover,
      p_prize_game: finalPrize,
      p_bet_value: entry.betValue,
      p_required_bets: entry.requiredBets,
      p_initial_bankroll: entry.initialBankroll,
      p_final_bankroll: entry.finalBankroll,
      p_spin_count: entry.spinCount,
      p_spin_bet: entry.spinBet,
      p_spin_prize: entry.spinPrize,
      p_created_at: isoCreated,
      p_account: account,
    });

    if (error) { toast.error('Erro ao atualizar'); return; }
    toast.success('Entrada atualizada!');
    if (updated) {
      const row = mapRow(updated);
      setEntries(prev => prev.map(e => e.id === id ? row : e));
    }
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.rpc('bet_and_win_delete', { p_id: id });
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Excluído!');
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const finalizeDayEntries = useCallback(async (
    entriesToFinalize: BetAndWinEntry[], dateKey: string, silent = false,
  ) => {
    if (!user) return;

    const ids = entriesToFinalize.map(e => e.id);

    const { error: updateError } = await supabase
      .from('bet_and_win_entries')
      .update({ finalized_month: dateKey })
      .in('id', ids);

    if (updateError) { if (!silent) toast.error('Erro ao finalizar'); return; }

    // Entradas já foram integradas ao dashboard no momento de criação,
    // aqui só marcamos como finalizadas para fins de histórico.
    const dayBalance = entriesToFinalize.reduce(
      (s, e) => s + ((e.finalBankroll - e.initialBankroll) + e.spinPrize), 0,
    );

    if (!silent) {
      toast.success(`Dia finalizado! Saldo de ${dayBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`);
    }
    const idSet = new Set(ids);
    setEntries(prev => prev.map(e => idSet.has(e.id) ? { ...e, finalizedMonth: dateKey } : e));
  }, [user]);

  // Auto-finalize past days once per load — guarded ref avoids re-running when
  // `entries` mutates after finalization.
  const autoFinalizedRef = useRef(false);
  useEffect(() => {
    if (loading || autoFinalizedRef.current) return;
    if (entries.length === 0) return;
    autoFinalizedRef.current = true;

    const today = todayBRT();
    const pastEntries = entries.filter(e => !e.finalizedMonth && e.entryDate < today);
    if (pastEntries.length === 0) return;

    const byDate = new Map<string, BetAndWinEntry[]>();
    pastEntries.forEach(e => {
      if (!byDate.has(e.entryDate)) byDate.set(e.entryDate, []);
      byDate.get(e.entryDate)!.push(e);
    });

    (async () => {
      for (const [dateKey, dayEntries] of byDate) {
        await finalizeDayEntries(dayEntries, dateKey, true);
      }
      toast.info(`${pastEntries.length} entrada(s) de dias anteriores finalizada(s) automaticamente.`);
    })();
  }, [loading, entries, finalizeDayEntries]);

  const finalizeDay = async () => {
    const today = todayBRT();
    const todayUnfinalized = entries.filter(e => !e.finalizedMonth && e.entryDate === today);
    
    if (todayUnfinalized.length === 0) {
      toast.info('Nenhuma entrada pendente para finalizar hoje');
      return;
    }

    await finalizeDayEntries(todayUnfinalized, today);
  };

  const simulatePromotion = useCallback((params: SimulationParams): SimulationResult => {
    const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Filter by house (fuzzy)
    const houseEntries = params.house
      ? entries.filter(e => normalize(e.house) === normalize(params.house))
      : entries;

    // Filter by prize game (fuzzy) for spin multiplier
    const gameEntries = params.prizeGame
      ? entries.filter(e => normalize(e.prizeGame) === normalize(params.prizeGame) && e.spinCount > 0 && e.spinBet > 0)
      : entries.filter(e => e.spinCount > 0 && e.spinBet > 0);

    const houseSamples = houseEntries.length;
    const gameSamples = gameEntries.length;

    // Average rollover loss for this house
    const avgRolloverLoss = houseSamples > 0
      ? houseEntries.reduce((sum, e) => sum + (e.initialBankroll - e.finalBankroll), 0) / houseSamples
      : 0;

    // Average spin multiplier from historical data
    const totalSpinValue = params.spinCount * params.spinBet;
    const multipliers = gameEntries
      .map(e => e.spinPrize / (e.spinCount * e.spinBet))
      .filter(m => isFinite(m) && m >= 0);
    const avgMultiplier = multipliers.length > 0
      ? multipliers.reduce((a, b) => a + b, 0) / multipliers.length
      : 1;
    const expectedSpinReturn = totalSpinValue * avgMultiplier;
    const maxRolloverLoss = expectedSpinReturn;

    // Recovery probability: % of entries where spin_prize >= rollover loss
    let recoveryProbability = 0;
    if (houseSamples > 0) {
      const recovered = houseEntries.filter(e => e.spinPrize >= (e.initialBankroll - e.finalBankroll)).length;
      recoveryProbability = (recovered / houseSamples) * 100;
    }

    // ---- Modelo teórico (RTP + volatilidade), calibrado pelo histórico quando existe ----
    const wagerSum = houseEntries.reduce((s, e) => s + (e.requiredBets > 0 ? e.requiredBets : 0), 0);
    const lossSum = houseEntries.reduce((s, e) => s + (e.requiredBets > 0 ? (e.initialBankroll - e.finalBankroll) : 0), 0);
    const rolloverRtpObserved = wagerSum > 0 ? Math.max(0, Math.min(1.2, 1 - lossSum / wagerSum)) : null;
    const prizeRtpObserved = multipliers.length > 0 ? Math.max(0, Math.min(3, avgMultiplier)) : null;

    const informedRolloverRtp = params.rolloverRtp ?? 0.92;
    const informedPrizeRtp = params.prizeRtp ?? 0.92;
    const rolloverRtpUsed = blendRtp(informedRolloverRtp, rolloverRtpObserved, houseSamples);
    const prizeRtpUsed = blendRtp(informedPrizeRtp, prizeRtpObserved, gameSamples);

    const model = runModel({
      requiredRollover: params.requiredRollover,
      rolloverRtp: rolloverRtpUsed,
      rolloverVolatility: 'medium',
      spinCount: params.spinCount,
      spinBet: params.spinBet,
      prizeRtp: prizeRtpUsed,
      prizeVolatility: params.prizeVolatility ?? 'medium',
    });

    return {
      avgRolloverLoss,
      expectedSpinReturn,
      maxRolloverLoss,
      recoveryProbability,
      verdict: model.verdict,
      houseSamples,
      gameSamples,
      model,
      rolloverRtpUsed,
      prizeRtpUsed,
      rolloverRtpObserved,
      prizeRtpObserved,
    };
  }, [entries]);


  const recommendRolloverGames = useCallback((params: RecommendParams): RecommendResult => {
    const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const houseEntries = params.house
      ? entries.filter(e => normalize(e.house) === normalize(params.house))
      : entries;

    if (houseEntries.length === 0) return { recommendations: [], mostConsistent: null };

    // Group rollover stats by rolloverGame
    const rolloverByGame = new Map<string, { losses: number[]; wagered: number[] }>();
    houseEntries.forEach(e => {
      if (!e.rolloverGame || e.requiredBets <= 0) return;
      const key = e.rolloverGame;
      if (!rolloverByGame.has(key)) rolloverByGame.set(key, { losses: [], wagered: [] });
      const g = rolloverByGame.get(key)!;
      g.losses.push(e.initialBankroll - e.finalBankroll);
      g.wagered.push(e.requiredBets);
    });

    // Group prize stats by prizeGame (across all entries — not just this house)
    const prizeByGame = new Map<string, number[]>();
    entries.forEach(e => {
      if (!e.prizeGame || e.spinCount <= 0 || e.spinBet <= 0) return;
      const mult = e.spinPrize / (e.spinCount * e.spinBet);
      if (!isFinite(mult) || mult < 0) return;
      if (!prizeByGame.has(e.prizeGame)) prizeByGame.set(e.prizeGame, []);
      prizeByGame.get(e.prizeGame)!.push(mult);
    });

    const totalSpinValue = params.spinCount * params.spinBet;
    const recs: RolloverRecommendation[] = [];

    const stddev = (arr: number[]) => {
      if (arr.length < 2) return 0;
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
      const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
      return Math.sqrt(variance);
    };
    const percentile = (arr: number[], p: number) => {
      const sorted = [...arr].sort((a, b) => a - b);
      const idx = Math.floor(sorted.length * p);
      return sorted[Math.min(idx, sorted.length - 1)];
    };

    const informedRolloverRtp = params.rolloverRtp ?? 0.92;
    const informedPrizeRtp = params.prizeRtp ?? 0.92;
    const prizeVolatility: Volatility = params.prizeVolatility ?? 'medium';

    rolloverByGame.forEach((roll, rolloverGame) => {
      if (roll.losses.length < 1) return;
      const avgLoss = roll.losses.reduce((a, b) => a + b, 0) / roll.losses.length;
      const avgWagered = roll.wagered.reduce((a, b) => a + b, 0) / roll.wagered.length;
      const rtpObs = avgWagered > 0 ? Math.max(0, Math.min(1.2, 1 - (avgLoss / avgWagered))) : null;
      const rolloverRtpUsed = blendRtp(informedRolloverRtp, rtpObs, roll.losses.length);
      const expectedCost = params.targetRollover * (1 - rolloverRtpUsed);

      prizeByGame.forEach((mults, prizeGame) => {
        if (mults.length < 1) return;
        const avgMult = mults.reduce((a, b) => a + b, 0) / mults.length;
        const p25Mult = percentile(mults, 0.25);
        const prizeRtpUsed = blendRtp(informedPrizeRtp, Math.max(0, Math.min(3, avgMult)), mults.length);
        const evPrize = totalSpinValue * prizeRtpUsed;
        const evPessimistic = totalSpinValue * p25Mult;

        const model = runModel({
          requiredRollover: params.targetRollover,
          rolloverRtp: rolloverRtpUsed,
          rolloverVolatility: 'medium',
          spinCount: params.spinCount,
          spinBet: params.spinBet,
          prizeRtp: prizeRtpUsed,
          prizeVolatility,
          iterations: 2000,
        });

        const combo = houseEntries.filter(e =>
          normalize(e.rolloverGame) === normalize(rolloverGame) &&
          normalize(e.prizeGame) === normalize(prizeGame)
        );

        recs.push({
          rolloverGame,
          prizeGame,
          expectedProfit: model.expectedProfit,
          expectedCost,
          evPrize,
          evPrizePessimistic: evPessimistic,
          profitProbability: model.profitProbability,
          rtpObserved: (rtpObs ?? rolloverRtpUsed) * 100,
          samples: combo.length || roll.losses.length,
          spinRatio: model.spinRatio,
          verdict: model.verdict,
        });
      });
    });


    // Sort by composite score
    recs.sort((a, b) => (b.expectedProfit * (b.profitProbability / 100)) - (a.expectedProfit * (a.profitProbability / 100)));

    // Most consistent rollover game (lowest coef of variation in loss/wagered)
    let mostConsistent: RecommendResult['mostConsistent'] = null;
    let bestCv = Infinity;
    rolloverByGame.forEach((roll, game) => {
      if (roll.losses.length < 3) return;
      const ratios = roll.losses.map((l, i) => roll.wagered[i] > 0 ? l / roll.wagered[i] : 0);
      const mean = ratios.reduce((a, b) => a + b, 0) / ratios.length;
      const sd = stddev(ratios);
      const cv = mean !== 0 ? Math.abs(sd / mean) : Infinity;
      const avgLoss = roll.losses.reduce((a, b) => a + b, 0) / roll.losses.length;
      const avgWagered = roll.wagered.reduce((a, b) => a + b, 0) / roll.wagered.length;
      const rtp = avgWagered > 0 ? Math.max(0, 1 - (avgLoss / avgWagered)) * 100 : 0;
      if (cv < bestCv) { bestCv = cv; mostConsistent = { game, rtpObserved: rtp, samples: roll.losses.length }; }
    });

    return { recommendations: recs.slice(0, 5), mostConsistent };
  }, [entries]);

  const totalBalance = useMemo(
    () => entries.reduce((sum, e) => sum + (e.finalBankroll - e.initialBankroll + e.spinPrize), 0),
    [entries],
  );
  const unfinalizedBalance = useMemo(
    () => entries
      .filter(e => !e.finalizedMonth)
      .reduce((sum, e) => sum + (e.finalBankroll - e.initialBankroll + e.spinPrize), 0),
    [entries],
  );

  return { entries, loading, houses, totalBalance, unfinalizedBalance, addEntry, updateEntry, deleteEntry, finalizeDay, simulatePromotion, recommendRolloverGames };
}
