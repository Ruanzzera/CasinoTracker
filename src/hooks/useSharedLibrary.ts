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

// Cache de sessão: a biblioteca é a mesma para todas as páginas.
// Evita repetir a leitura do banco a cada navegação/entrada nova.
const libraryCache: { houses: string[]; games: string[]; fetchedAt: number } = {
  houses: [],
  games: [],
  fetchedAt: 0,
};
const CACHE_TTL_MS = 10 * 60 * 1000;

export function useSharedLibrary() {
  const [houses, setHouses] = useState<string[]>(libraryCache.houses);
  const [games, setGames] = useState<string[]>(libraryCache.games);
  const [loaded, setLoaded] = useState(libraryCache.fetchedAt > 0);
  const { user } = useAuth();

  const fetchLibrary = useCallback(async (force = false) => {
    if (!user) return;

    // Cache: só vai ao banco se expirou ou se for forçado (ex.: após renomear).
    if (!force && libraryCache.fetchedAt > 0 && Date.now() - libraryCache.fetchedAt < CACHE_TTL_MS) {
      setHouses(libraryCache.houses);
      setGames(libraryCache.games);
      setLoaded(true);
      return;
    }

    // Uma única chamada agregada no banco (RLS aplicada: SECURITY INVOKER),
    // no lugar de 4 varreduras de tabela trazendo até 10.000 linhas cada.
    const { data, error } = await supabase.rpc('library_names');

    if (error) {
      console.error('Error fetching library:', error?.message);
      return;
    }

    const payload = (data || {}) as { houses?: string[]; games?: string[] };
    const nextHouses = (payload.houses || []).filter(Boolean).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const nextGames = (payload.games || []).filter(Boolean).sort((a, b) => a.localeCompare(b, 'pt-BR'));

    libraryCache.houses = nextHouses;
    libraryCache.games = nextGames;
    libraryCache.fetchedAt = Date.now();

    setHouses(nextHouses);
    setGames(nextGames);
    setLoaded(true);
  }, [user]);

  /* ===== CÓDIGO ANTIGO (mantido comentado até confirmação dos números) =====
  const fetchLibraryLegacy = useCallback(async () => {
    if (!user) return;

    // IMPORTANTE: Supabase corta em 1000 linhas por padrão. Sem ordenar por
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
  ===== FIM CÓDIGO ANTIGO ===== */

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
    if (!name) return;
    if (!libraryCache.houses.includes(name)) {
      libraryCache.houses = [...libraryCache.houses, name].sort((a, b) => a.localeCompare(b, 'pt-BR'));
      setHouses(libraryCache.houses);
    }
  }, []);

  const addGameIfNew = useCallback((name: string) => {
    if (!name) return;
    if (!libraryCache.games.includes(name)) {
      libraryCache.games = [...libraryCache.games, name].sort((a, b) => a.localeCompare(b, 'pt-BR'));
      setGames(libraryCache.games);
    }
  }, []);

  // Atualiza o cache local com os nomes de uma entrada recém-salva,
  // sem ir ao banco de novo.
  const noteNames = useCallback((house?: string, game?: string) => {
    if (house) addHouseIfNew(house);
    if (game) addGameIfNew(game);
  }, [addHouseIfNew, addGameIfNew]);

  return {
    houses,
    games,
    loaded,
    resolveHouse,
    resolveGame,
    addHouseIfNew,
    addGameIfNew,
    noteNames,
    refresh: fetchLibrary,
  };
}
