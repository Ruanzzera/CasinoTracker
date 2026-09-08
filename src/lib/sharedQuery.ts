import { useCallback, useEffect, useState } from 'react';

/**
 * Cache compartilhado entre componentes (escopo de sessão do navegador).
 * Evita que várias peças da tela busquem a mesma coisa ao mesmo tempo:
 * - dedupe de requisições simultâneas (uma promise por chave)
 * - TTL configurável
 * - todos os assinantes recebem o mesmo dado e atualizações otimistas
 */
interface CacheEntry<T> {
  data: T | undefined;
  fetchedAt: number;
  promise: Promise<T> | null;
  listeners: Set<(data: T) => void>;
}

const store = new Map<string, CacheEntry<unknown>>();

function getEntry<T>(key: string): CacheEntry<T> {
  let e = store.get(key) as CacheEntry<T> | undefined;
  if (!e) {
    e = { data: undefined, fetchedAt: 0, promise: null, listeners: new Set() };
    store.set(key, e as CacheEntry<unknown>);
  }
  return e;
}

export function setSharedData<T>(key: string, data: T) {
  const e = getEntry<T>(key);
  e.data = data;
  e.fetchedAt = Date.now();
  e.listeners.forEach(l => l(data));
}

export function invalidateShared(key: string) {
  const e = store.get(key);
  if (e) e.fetchedAt = 0;
}

export function useSharedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { ttlMs?: number; enabled?: boolean } = {},
) {
  const { ttlMs = 5 * 60 * 1000, enabled = true } = options;
  const entry = getEntry<T>(key);
  const [data, setData] = useState<T | undefined>(entry.data);
  const [loading, setLoading] = useState<boolean>(entry.data === undefined && enabled);

  const load = useCallback(async (force = false) => {
    if (!enabled) return;
    const e = getEntry<T>(key);

    if (!force && e.data !== undefined && Date.now() - e.fetchedAt < ttlMs) {
      setData(e.data);
      setLoading(false);
      return;
    }

    if (e.promise && !force) {
      setLoading(e.data === undefined);
      try { setData(await e.promise); } finally { setLoading(false); }
      return;
    }

    setLoading(e.data === undefined);
    e.promise = fetcher();
    try {
      const result = await e.promise;
      e.data = result;
      e.fetchedAt = Date.now();
      e.listeners.forEach(l => l(result));
      setData(result);
    } catch (err) {
      console.error('sharedQuery error:', (err as Error)?.message);
    } finally {
      e.promise = null;
      setLoading(false);
    }
  }, [key, fetcher, ttlMs, enabled]);

  useEffect(() => {
    const e = getEntry<T>(key);
    const listener = (d: T) => setData(d);
    e.listeners.add(listener);
    return () => { e.listeners.delete(listener); };
  }, [key]);

  useEffect(() => { load(); }, [load]);

  // Atualização local (otimista) propagada a todos os assinantes.
  const update = useCallback((updater: (prev: T | undefined) => T) => {
    const e = getEntry<T>(key);
    const next = updater(e.data);
    e.data = next;
    e.fetchedAt = Date.now();
    e.listeners.forEach(l => l(next));
  }, [key]);

  return { data, loading, refresh: () => load(true), update };
}
