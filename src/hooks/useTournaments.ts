import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { normalizeHouseName, findExistingHouse } from './useSharedLibrary';
import { toast } from 'sonner';
import { monthKeyBRT } from '@/lib/timezone';
import { useAuth } from '@/hooks/useAuth';

type TournamentRow = Database['public']['Tables']['tournaments']['Row'];
type TournamentSessionRow = Database['public']['Tables']['tournament_sessions']['Row'];

export interface TournamentSession {
  id: string;
  tournamentId: string;
  userId: string;
  sessionDate: string;
  spinsCount: number;
  betValue: number;
  initialBankroll: number;
  finalBankroll: number;
  rolloverGame: string;
  createdAt: string;
}

export interface Tournament {
  id: string;
  userId: string;
  name: string;
  house: string;
  startDate: string;
  endDate: string;
  rolloverGame: string;
  pointsPerReal: number;
  prizeSpinsCount: number;
  prizeSpinsValue: number;
  prizeType: 'giros' | 'saldo_real';
  prizeCashValue: number;
  initialPosition: number;
  initialPoints: number;
  currentPosition: number;
  pointsPlayerAbove: number;
  pointsPlayerBelow: number;
  targetPoints: number;
  manualInvested: number | null;
  prizePositionCutoff: number;
  finalizedMonth: string | null;
  actualWinnings: number | null;
  createdAt: string;
}

export function useTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [sessions, setSessions] = useState<TournamentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [houses, setHouses] = useState<string[]>([]);
  const { user } = useAuth();

  const mapTournament = (row: TournamentRow): Tournament => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    house: row.house,
    startDate: row.start_date,
    endDate: row.end_date,
    rolloverGame: row.rollover_game,
    pointsPerReal: Number(row.points_per_real),
    prizeSpinsCount: Number(row.prize_spins_count),
    prizeSpinsValue: Number(row.prize_spins_value),
    prizeType: (row.prize_type === 'saldo_real' ? 'saldo_real' : 'giros'),
    prizeCashValue: Number(row.prize_cash_value ?? 0),
    initialPosition: Number(row.initial_position ?? 0),
    initialPoints: Number(row.initial_points ?? 0),
    currentPosition: Number(row.current_position),
    pointsPlayerAbove: Number(row.points_player_above),
    pointsPlayerBelow: Number(row.points_player_below),
    targetPoints: Number(row.target_points),
    manualInvested: row.manual_invested === null || row.manual_invested === undefined ? null : Number(row.manual_invested),
    prizePositionCutoff: Number(row.prize_position_cutoff ?? 0),
    finalizedMonth: row.finalized_month,
    actualWinnings: row.actual_winnings === null || row.actual_winnings === undefined ? null : Number(row.actual_winnings),
    createdAt: row.created_at,
  });

  const mapSession = (row: TournamentSessionRow): TournamentSession => ({
    id: row.id,
    tournamentId: row.tournament_id,
    userId: row.user_id,
    sessionDate: row.session_date,
    spinsCount: Number(row.spins_count),
    betValue: Number(row.bet_value),
    initialBankroll: Number(row.initial_bankroll),
    finalBankroll: Number(row.final_bankroll),
    rolloverGame: row.rollover_game ?? '',
    createdAt: row.created_at,
  });

  const fetchData = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    const [tRes, sRes] = await Promise.all([
      supabase.from('tournaments').select('*').order('created_at', { ascending: false }),
      supabase.from('tournament_sessions').select('*').order('created_at', { ascending: true }),
    ]);

    if (tRes.error) { console.error(tRes.error?.message); setLoading(false); return; }
    if (sRes.error) { console.error(sRes.error?.message); setLoading(false); return; }

    const ts = (tRes.data || []).map(mapTournament);
    const ss = (sRes.data || []).map(mapSession);
    setTournaments(ts);
    setSessions(ss);
    setHouses([...new Set(ts.map(t => t.house))]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createTournament = async (input: Partial<Tournament> & { house: string }) => {
    if (!user) return null;

    const existingHouse = findExistingHouse(input.house, houses);
    const finalHouse = existingHouse || normalizeHouseName(input.house);

    const { data, error } = await supabase.from('tournaments').insert({
      user_id: user.id,
      name: input.name || '',
      house: finalHouse,
      start_date: input.startDate || new Date().toISOString().split('T')[0],
      end_date: input.endDate || new Date().toISOString().split('T')[0],
      rollover_game: input.rolloverGame || '',
      points_per_real: input.pointsPerReal ?? 1,
      prize_spins_count: input.prizeSpinsCount ?? 0,
      prize_spins_value: input.prizeSpinsValue ?? 0,
      prize_type: input.prizeType ?? 'giros',
      prize_cash_value: input.prizeCashValue ?? 0,
      initial_position: input.initialPosition ?? 0,
      initial_points: input.initialPoints ?? 0,
      current_position: input.currentPosition ?? 0,
      points_player_above: input.pointsPlayerAbove ?? 0,
      points_player_below: input.pointsPlayerBelow ?? 0,
      target_points: input.targetPoints ?? 0,
      manual_invested: input.manualInvested ?? null,
      prize_position_cutoff: input.prizePositionCutoff ?? 0,
    }).select().single();

    if (error) { toast.error('Erro ao criar torneio'); return null; }
    toast.success('Torneio criado!');
    if (data) {
      const t = mapTournament(data);
      setTournaments(prev => [t, ...prev]);
      if (!houses.includes(t.house)) setHouses(prev => [...prev, t.house]);
    }
    return data?.id as string;
  };

  const updateTournament = async (id: string, updates: Partial<Tournament>) => {
    const payload: Database['public']['Tables']['tournaments']['Update'] = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.house !== undefined) payload.house = updates.house;
    if (updates.startDate !== undefined) payload.start_date = updates.startDate;
    if (updates.endDate !== undefined) payload.end_date = updates.endDate;
    if (updates.rolloverGame !== undefined) payload.rollover_game = updates.rolloverGame;
    if (updates.pointsPerReal !== undefined) payload.points_per_real = updates.pointsPerReal;
    if (updates.prizeSpinsCount !== undefined) payload.prize_spins_count = updates.prizeSpinsCount;
    if (updates.prizeSpinsValue !== undefined) payload.prize_spins_value = updates.prizeSpinsValue;
    if (updates.prizeType !== undefined) payload.prize_type = updates.prizeType;
    if (updates.prizeCashValue !== undefined) payload.prize_cash_value = updates.prizeCashValue;
    if (updates.initialPosition !== undefined) payload.initial_position = updates.initialPosition;
    if (updates.initialPoints !== undefined) payload.initial_points = updates.initialPoints;
    if (updates.currentPosition !== undefined) payload.current_position = updates.currentPosition;
    if (updates.pointsPlayerAbove !== undefined) payload.points_player_above = updates.pointsPlayerAbove;
    if (updates.pointsPlayerBelow !== undefined) payload.points_player_below = updates.pointsPlayerBelow;
    if (updates.targetPoints !== undefined) payload.target_points = updates.targetPoints;
    if (updates.manualInvested !== undefined) payload.manual_invested = updates.manualInvested;
    if (updates.prizePositionCutoff !== undefined) payload.prize_position_cutoff = updates.prizePositionCutoff;
    if (updates.actualWinnings !== undefined) payload.actual_winnings = updates.actualWinnings;

    const { data, error } = await supabase.from('tournaments').update(payload).eq('id', id).select().single();
    if (error) { toast.error('Erro ao atualizar'); return; }
    if (data) {
      const t = mapTournament(data);
      setTournaments(prev => prev.map(x => x.id === id ? t : x));
    }
  };

  const deleteTournament = async (id: string) => {
    const { error } = await supabase.from('tournaments').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Torneio excluído');
    setTournaments(prev => prev.filter(t => t.id !== id));
    setSessions(prev => prev.filter(s => s.tournamentId !== id));
  };

  const addSession = async (tournamentId: string, input: {
    sessionDate?: string; spinsCount: number; betValue: number;
    initialBankroll: number; finalBankroll: number; rolloverGame?: string;
  }) => {
    if (!user) return;

    const { data, error } = await supabase.from('tournament_sessions').insert({
      tournament_id: tournamentId,
      user_id: user.id,
      session_date: input.sessionDate || new Date().toISOString().split('T')[0],
      spins_count: input.spinsCount,
      bet_value: input.betValue,
      initial_bankroll: input.initialBankroll,
      final_bankroll: input.finalBankroll,
      rollover_game: input.rolloverGame || '',
    }).select().single();
    if (error) { toast.error('Erro ao adicionar sessão'); return; }
    toast.success('Sessão adicionada!');
    if (data) setSessions(prev => [...prev, mapSession(data)]);
  };

  const updateSession = async (id: string, updates: Partial<TournamentSession>) => {
    const payload: Database['public']['Tables']['tournament_sessions']['Update'] = {};
    if (updates.sessionDate !== undefined) payload.session_date = updates.sessionDate;
    if (updates.spinsCount !== undefined) payload.spins_count = updates.spinsCount;
    if (updates.betValue !== undefined) payload.bet_value = updates.betValue;
    if (updates.initialBankroll !== undefined) payload.initial_bankroll = updates.initialBankroll;
    if (updates.finalBankroll !== undefined) payload.final_bankroll = updates.finalBankroll;
    if (updates.rolloverGame !== undefined) payload.rollover_game = updates.rolloverGame;

    const { data, error } = await supabase.from('tournament_sessions').update(payload).eq('id', id).select().single();
    if (error) { toast.error('Erro ao atualizar sessão'); return; }
    if (data) setSessions(prev => prev.map(s => s.id === id ? mapSession(data) : s));
  };

  const deleteSession = async (id: string) => {
    const { error } = await supabase.from('tournament_sessions').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir sessão'); return; }
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  // Aggregations per tournament
  const getTournamentStats = (tournamentId: string) => {
    const ss = sessions.filter(s => s.tournamentId === tournamentId);
    const t = tournaments.find(t => t.id === tournamentId);
    if (!t) return null;

    const totalWagered = ss.reduce((sum, s) => sum + s.spinsCount * s.betValue, 0);
    const earnedPoints = totalWagered * t.pointsPerReal;
    const totalPoints = (t.initialPoints || 0) + earnedPoints;
    const computedLoss = ss.reduce((sum, s) => sum + (s.initialBankroll - s.finalBankroll), 0);
    const totalLoss = t.manualInvested !== null && t.manualInvested !== undefined
      ? Number(t.manualInvested)
      : computedLoss;
    const currentBankroll = ss.length > 0 ? ss[ss.length - 1].finalBankroll : 0;
    const sessionsCount = ss.length;

    // Cost per real wagered (loss / wagered)
    const costPerReal = totalWagered > 0 ? totalLoss / totalWagered : 0;

    // Valor estimado do prêmio (zera se já está fora da faixa premiada)
    const inPrizeRange = t.prizePositionCutoff <= 0 || t.currentPosition <= 0 || t.currentPosition <= t.prizePositionCutoff;
    const rawPrizeValue = t.prizeType === 'saldo_real'
      ? (t.prizeCashValue || 0)
      : t.prizeSpinsCount * t.prizeSpinsValue;
    // Se o torneio já foi finalizado e o usuário informou o ganho real, prioriza esse valor
    const prizeValue = t.finalizedMonth && t.actualWinnings !== null && t.actualWinnings !== undefined
      ? Number(t.actualWinnings)
      : (inPrizeRange ? rawPrizeValue : 0);

    // Forecast: pontos potenciais com banca restante (sem perder mais que a banca atual)
    const potentialAdditionalWagered = costPerReal > 0 ? currentBankroll / costPerReal : currentBankroll * 100;
    const potentialAdditionalPoints = potentialAdditionalWagered * t.pointsPerReal;
    const projectedTotalPoints = totalPoints + potentialAdditionalPoints;

    // Saldo previsto: prêmio − perda total
    const projectedNetResult = prizeValue - totalLoss;

    // Gasto previsto p/ alcançar player acima
    const pointsNeededToOvertake = Math.max(0, t.pointsPlayerAbove - totalPoints);
    const wageredNeededToOvertake = t.pointsPerReal > 0 ? pointsNeededToOvertake / t.pointsPerReal : 0;
    const costToOvertake = wageredNeededToOvertake * costPerReal;

    // Colocação prevista
    let projectedPosition = t.currentPosition;
    if (projectedTotalPoints >= t.pointsPlayerAbove && t.pointsPlayerAbove > 0) projectedPosition = Math.max(1, t.currentPosition - 1);
    else if (projectedTotalPoints < t.pointsPlayerBelow && t.pointsPlayerBelow > 0) projectedPosition = t.currentPosition + 1;

    return {
      sessions: ss,
      sessionsCount,
      totalWagered,
      totalPoints,
      earnedPoints,
      totalLoss,
      currentBankroll,
      costPerReal,
      prizeValue,
      potentialAdditionalPoints,
      projectedTotalPoints,
      projectedNetResult,
      pointsNeededToOvertake,
      costToOvertake,
      projectedPosition,
      computedLoss,
      inPrizeRange,
      rawPrizeValue,
    };
  };

  const finalizeTournament = async (tournamentId: string, actualWinnings?: number) => {
    if (!user) return;

    const t = tournaments.find(x => x.id === tournamentId);
    const stats = getTournamentStats(tournamentId);
    if (!t || !stats) return;

    const monthKey = monthKeyBRT();
    const winnings = actualWinnings !== undefined ? actualWinnings : stats.prizeValue;
    const balance = winnings - stats.totalLoss;

    const { data: updRow, error: updErr } = await supabase.from('tournaments')
      .update({ finalized_month: monthKey, actual_winnings: winnings })
      .eq('id', tournamentId)
      .select()
      .single();
    if (updErr) { toast.error('Erro ao finalizar'); return; }

    // Torneios mantêm montante próprio — não são integrados ao lucro do dashboard.

    toast.success(`Torneio finalizado! Saldo: ${balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
    if (updRow) {
      const tt = mapTournament(updRow);
      setTournaments(prev => prev.map(x => x.id === tournamentId ? tt : x));
    }
  };

  return {
    tournaments, sessions, loading, houses,
    createTournament, updateTournament, deleteTournament,
    addSession, updateSession, deleteSession,
    getTournamentStats, finalizeTournament,
  };
}
