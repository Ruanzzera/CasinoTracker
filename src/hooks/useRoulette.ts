import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export interface RouletteProject {
  id: string;
  initialBankroll: number;
  currentBankroll: number;
  betValue: number;
}

export interface RouletteMode {
  id: string;
  name: string;
  payoutMultiplier: number;
  defaultBet: number;
  isDefault: boolean;
  matchRounds: number;
  maxGales: number;
}

export interface RouletteSpin {
  id: string;
  matchId: string;
  roundIndex: number;
  result: 'W' | 'L';
  betValue: number;
  profit: number;
  playedAt: Date;
  isGale: boolean;
  galeStake: number | null;
  galeCount: number;
}

export interface RouletteMatch {
  id: string;
  projectId: string;
  matchDate: string;
  startedAt: Date;
  finishedAt: Date | null;
  score: string;
  profit: number;
  betValue: number;
  modeId: string | null;
  modeName: string;
  payoutMultiplier: number;
  spins: RouletteSpin[];
}

import { spinProfit, type SpinInput } from '@/lib/roulette-math';
export { spinProfit, type SpinInput };

export function useRoulette() {
  const [project, setProject] = useState<RouletteProject | null>(null);
  const [modes, setModes] = useState<RouletteMode[]>([]);
  const [matches, setMatches] = useState<RouletteMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadAll = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    const { data: projects } = await supabase
      .from('roulette_projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1);

    const proj = projects?.[0];
    if (!proj) {
      // Do NOT auto-create — user must explicitly opt in via `createProject`.
      setProject(null);
      setModes([]);
      setMatches([]);
      setLoading(false);
      return;
    }

    setProject({
      id: proj.id,
      initialBankroll: Number(proj.initial_bankroll),
      currentBankroll: Number(proj.current_bankroll),
      betValue: Number(proj.bet_value),
    });

    // Load or seed modes
    let { data: modeRows } = await supabase
      .from('roulette_modes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (!modeRows || modeRows.length === 0) {
      const seed = [
        { user_id: user.id, name: 'Roleta', payout_multiplier: 3, default_bet: 10, is_default: true },
        { user_id: user.id, name: 'Bacbo', payout_multiplier: 2, default_bet: 10, is_default: false },
      ];
      const { data: created } = await supabase.from('roulette_modes').insert(seed).select();
      modeRows = created ?? [];
    }

    setModes((modeRows ?? []).map(m => ({
      id: m.id,
      name: m.name,
      payoutMultiplier: Number(m.payout_multiplier),
      defaultBet: Number(m.default_bet),
      isDefault: !!m.is_default,
      matchRounds: Number((m as { match_rounds?: number }).match_rounds ?? 3),
      maxGales: Number((m as { max_gales?: number }).max_gales ?? 2),
    })));

    const { data: matchRows } = await supabase
      .from('roulette_matches')
      .select('*')
      .eq('user_id', user.id)
      .eq('project_id', proj.id)
      .order('started_at', { ascending: false });

    const matchIds = (matchRows ?? []).map(m => m.id);
    let spinsByMatch = new Map<string, RouletteSpin[]>();
    if (matchIds.length) {
      const { data: spinRows } = await supabase
        .from('roulette_spins')
        .select('*')
        .in('match_id', matchIds)
        .order('round_index', { ascending: true });
      (spinRows ?? []).forEach(s => {
        const arr = spinsByMatch.get(s.match_id) ?? [];
        arr.push({
          id: s.id,
          matchId: s.match_id,
          roundIndex: s.round_index,
          result: s.result as 'W' | 'L',
          betValue: Number(s.bet_value),
          profit: Number(s.profit),
          playedAt: new Date(s.played_at),
          isGale: !!(s as { is_gale?: boolean }).is_gale,
          galeStake: (s as { gale_stake?: number | null }).gale_stake != null ? Number((s as { gale_stake?: number | null }).gale_stake) : null,
          galeCount: Number((s as { gale_count?: number }).gale_count ?? 0),
        });
        spinsByMatch.set(s.match_id, arr);
      });
    }

    setMatches((matchRows ?? []).map(m => ({
      id: m.id,
      projectId: m.project_id,
      matchDate: m.match_date,
      startedAt: new Date(m.started_at),
      finishedAt: m.finished_at ? new Date(m.finished_at) : null,
      score: m.score,
      profit: Number(m.profit),
      betValue: Number(m.bet_value),
      modeId: (m as { mode_id?: string | null }).mode_id ?? null,
      modeName: (m as { mode_name?: string }).mode_name ?? 'Roleta',
      payoutMultiplier: Number((m as { payout_multiplier?: number }).payout_multiplier ?? 3),
      spins: spinsByMatch.get(m.id) ?? [],
    })));

    setLoading(false);
  }, [user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const createProject = useCallback(async (initialBankroll = 0, betValue = 10) => {
    if (!user) return;
    const { error } = await supabase
      .from('roulette_projects')
      .insert({ user_id: user.id, initial_bankroll: initialBankroll, current_bankroll: initialBankroll, bet_value: betValue });
    if (error) { toast.error('Erro ao criar projeto'); return; }
    toast.success('Projeto criado!');
    await loadAll();
  }, [user, loadAll]);

  const updateProject = async (patch: Partial<Pick<RouletteProject, 'initialBankroll' | 'currentBankroll' | 'betValue'>>) => {
    if (!project) return;
    const dbPatch: Record<string, number> = {};
    if (patch.initialBankroll !== undefined) dbPatch.initial_bankroll = patch.initialBankroll;
    if (patch.currentBankroll !== undefined) dbPatch.current_bankroll = patch.currentBankroll;
    if (patch.betValue !== undefined) dbPatch.bet_value = patch.betValue;
    const { error } = await supabase.from('roulette_projects').update(dbPatch).eq('id', project.id);
    if (error) { toast.error('Erro ao atualizar'); return; }
    setProject({ ...project, ...patch });
  };

  // ===== Modes CRUD =====
  const createMode = async (input: Omit<RouletteMode, 'id'>) => {
    if (!user) return;
    if (input.isDefault) {
      await supabase.from('roulette_modes').update({ is_default: false }).eq('user_id', user.id);
    }
    const { error } = await supabase.from('roulette_modes').insert({
      user_id: user.id,
      name: input.name,
      payout_multiplier: input.payoutMultiplier,
      default_bet: input.defaultBet,
      is_default: input.isDefault,
      match_rounds: input.matchRounds,
      max_gales: input.maxGales,
    });
    if (error) { toast.error('Erro ao criar modo'); return; }
    await loadAll();
  };

  const updateMode = async (id: string, patch: Partial<Omit<RouletteMode, 'id'>>) => {
    if (!user) return;
    if (patch.isDefault) {
      await supabase.from('roulette_modes').update({ is_default: false }).eq('user_id', user.id);
    }
    const dbPatch: Record<string, unknown> = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.payoutMultiplier !== undefined) dbPatch.payout_multiplier = patch.payoutMultiplier;
    if (patch.defaultBet !== undefined) dbPatch.default_bet = patch.defaultBet;
    if (patch.isDefault !== undefined) dbPatch.is_default = patch.isDefault;
    if (patch.matchRounds !== undefined) dbPatch.match_rounds = patch.matchRounds;
    if (patch.maxGales !== undefined) dbPatch.max_gales = patch.maxGales;
    const { error } = await supabase.from('roulette_modes').update(dbPatch).eq('id', id);
    if (error) { toast.error('Erro ao atualizar modo'); return; }
    await loadAll();
  };

  const deleteMode = async (id: string) => {
    const { error } = await supabase.from('roulette_modes').delete().eq('id', id);
    if (error) { toast.error('Erro ao remover modo'); return; }
    await loadAll();
  };

  /** Save a complete MD3 match with its spins. */
  const saveMatch = async (
    spins: SpinInput[],
    stake: number,
    mode: RouletteMode,
  ) => {
    if (!user || !project) return;

    const wins = spins.filter(s => s.result === 'W').length;
    const losses = spins.filter(s => s.result === 'L').length;
    const score = `${wins}-${losses}`;
    const profit = spins.reduce((acc, s) => acc + spinProfit(stake, mode.payoutMultiplier, s), 0);
    const now = new Date();

    const { data: matchRow, error: e1 } = await supabase
      .from('roulette_matches')
      .insert({
        user_id: user.id,
        project_id: project.id,
        match_date: now.toISOString().slice(0, 10),
        started_at: now.toISOString(),
        finished_at: now.toISOString(),
        score,
        profit,
        bet_value: stake,
        mode_id: mode.id,
        mode_name: mode.name,
        payout_multiplier: mode.payoutMultiplier,
      })
      .select()
      .single();
    if (e1 || !matchRow) { toast.error('Erro ao salvar partida'); return; }

    const spinPayload = spins.map((s, i) => ({
      user_id: user.id,
      match_id: matchRow.id,
      project_id: project.id,
      round_index: i + 1,
      result: s.result,
      bet_value: stake,
      profit: spinProfit(stake, mode.payoutMultiplier, s),
      is_gale: s.galeCount > 0,
      gale_stake: s.galeCount > 0 ? stake * Math.pow(2, s.galeCount) : null,
      gale_count: s.galeCount,
      played_at: new Date(now.getTime() + i).toISOString(),
    }));
    await supabase.from('roulette_spins').insert(spinPayload);

    await updateProject({ currentBankroll: project.currentBankroll + profit });
    await loadAll();
    toast.success(`Partida finalizada — ${score} (${profit >= 0 ? '+' : ''}R$ ${profit.toFixed(2)})`);
  };

  const deleteMatch = async (id: string) => {
    const m = matches.find(x => x.id === id);
    if (!m || !project) return;
    await supabase.from('roulette_spins').delete().eq('match_id', id);
    const { error } = await supabase.from('roulette_matches').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); return; }
    await updateProject({ currentBankroll: project.currentBankroll - m.profit });
    await loadAll();
  };

  const resetProject = async () => {
    if (!project) return;
    await supabase.from('roulette_spins').delete().eq('project_id', project.id);
    await supabase.from('roulette_matches').delete().eq('project_id', project.id);
    await updateProject({ currentBankroll: project.initialBankroll });
    await loadAll();
    toast.success('Projeto resetado');
  };

  return {
    project, modes, matches, loading,
    updateProject, saveMatch, deleteMatch, resetProject, createProject,
    createMode, updateMode, deleteMode,
    reload: loadAll,
  };
}