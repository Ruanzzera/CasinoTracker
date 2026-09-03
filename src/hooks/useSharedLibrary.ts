import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Normalize house name: trim spaces and normalize spacing/casing
export function normalizeHouseName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Find an existing name by fuzzy match (ignores spaces, case, accents)
function fuzzyMatch(input: string, list: string[]): string | null {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/\s+/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const normalizedInput = normalize(input);
  return list.find(h => normalize(h) === normalizedInput) || null;
}

export function findExistingHouse(input: string, houses: string[]): string | null {
  return fuzzyMatch(input, houses);
}

export function findExistingGame(input: string, games: string[]): string | null {
  return fuzzyMatch(input, games);
}

export function useSharedLibrary() {
  const [houses, setHouses] = useState<string[]>([]);
  const [games, setGames] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const { user } = useAuth();

  const fetchLibrary = useCallback(async () => {
    if (!user) return;

    // IMPORTANT: Supabase corta em 1000 linhas por padrão. Sem ordenar por
    // created_at desc, entradas recém-criadas podem cair fora da janela e
    // sumir da biblioteca. Ordenamos por mais recente e expandimos o range
    // para garantir que novos nomes apareçam imediatamente.
    const RANGE_END = 9999;
    const [casinoRes, betRes, tournamentsRes, sessionsRes] = await Promise.all([
      supabase.from('casino_entries').select('house, game, created_at').order('created_at', { ascending: false }).range(0, RANGE_END),
      supabase.from('bet_and_win_entries').select('house, game, prize_game, created_at').order('created_at', { ascending: false }).range(0, RANGE_END),
      supabase.from('tournaments').select('house, rollover_game, created_at').order('created_at', { ascending: false }).range(0, RANGE_END),
      supabase.from('tournament_sessions').select('rollover_game, created_at').order('created_at', { ascending: false }).range(0, RANGE_END),
    ]);

    const allHouses = new Set<string>();
    const allGames = new Set<string>();

    (casinoRes.data || []).forEach(e => {
      if (e.house) allHouses.add(e.house);
      if (e.game) allGames.add(e.game);
    });
    (betRes.data || []).forEach(e => {
      if (e.house) allHouses.add(e.house);
      if (e.game) allGames.add(e.game);
      if (e.prize_game) allGames.add(e.prize_game);
    });
    (tournamentsRes.data || []).forEach(e => {
      if (e.house) allHouses.add(e.house);
      if (e.rollover_game) allGames.add(e.rollover_game);
    });
    (sessionsRes.data || []).forEach(e => {
      if (e.rollover_game) allGames.add(e.rollover_game);
    });

    setHouses([...allHouses].sort((a, b) => a.localeCompare(b, 'pt-BR')));
    setGames([...allGames].sort((a, b) => a.localeCompare(b, 'pt-BR')));
    setLoaded(true);
  }, [user]);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  const resolveHouse = useCallback((input: string): string => {
    return findExistingHouse(input, houses) || normalizeHouseName(input);
  }, [houses]);

  const resolveGame = useCallback((input: string): string => {
    return findExistingGame(input, games) || input.trim();
  }, [games]);

  const addHouseIfNew = useCallback((name: string) => {
    if (!houses.includes(name)) {
      setHouses(prev => [...prev, name].sort((a, b) => a.localeCompare(b, 'pt-BR')));
    }
  }, [houses]);

  const addGameIfNew = useCallback((name: string) => {
    if (!games.includes(name)) {
      setGames(prev => [...prev, name].sort((a, b) => a.localeCompare(b, 'pt-BR')));
    }
  }, [games]);

  return { houses, games, loaded, resolveHouse, resolveGame, addHouseIfNew, addGameIfNew, refresh: fetchLibrary };
}
