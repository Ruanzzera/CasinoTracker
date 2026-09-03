import { useMemo } from 'react';
import { Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { CasinoEntry, entryTypeLabels } from '@/types/casino';
import { toBRT, nowBRT } from '@/lib/timezone';

interface Props {
  entries: CasinoEntry[];
}

const weekDaysFull = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function TimeRecommendations({ entries }: Props) {
  const { recs, dayLabel, hour, fallback } = useMemo(() => {
    const now = nowBRT();
    const dow = now.getDay();
    const hr = now.getHours();

    // Janela: ±1h no mesmo dia da semana
    const inWindow = (e: CasinoEntry) => {
      const d = toBRT(e.createdAt);
      if (d.getDay() !== dow) return false;
      const diff = Math.abs(d.getHours() - hr);
      return diff <= 1;
    };

    let pool = entries.filter(inWindow);
    let usedFallback = false;

    // Fallback: mesmo horário em qualquer dia
    if (pool.length < 3) {
      pool = entries.filter(e => Math.abs(toBRT(e.createdAt).getHours() - hr) <= 1);
      usedFallback = pool.length >= 3;
    }

    if (pool.length === 0) {
      return { recs: [], dayLabel: weekDaysFull[dow], hour: hr, fallback: false };
    }

    type Key = string;
    const map = new Map<Key, { house: string; game: string; type: string; total: number; count: number }>();
    pool.forEach(e => {
      const key = `${e.house}|${e.game}|${e.type}`;
      const cur = map.get(key) || { house: e.house, game: e.game, type: e.type, total: 0, count: 0 };
      cur.total += e.amount;
      cur.count += 1;
      map.set(key, cur);
    });

    const list = [...map.values()]
      .map(r => ({ ...r, avg: r.total / r.count }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return { recs: list, dayLabel: weekDaysFull[dow], hour: hr, fallback: usedFallback };
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <div className="stat-card">
      <div className="flex items-center gap-2 mb-1">
        <Clock className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Recomendados para agora</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        {fallback
          ? `Baseado em entradas próximas das ${hour.toString().padStart(2, '0')}h (qualquer dia)`
          : `Baseado em ${dayLabel} entre ${Math.max(0, hour - 1).toString().padStart(2, '0')}h–${Math.min(23, hour + 1).toString().padStart(2, '0')}h`}
      </p>

      {recs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem dados suficientes para este horário.</p>
      ) : (
        <div className="space-y-2">
          {recs.map((r, i) => {
            const positive = r.total >= 0;
            return (
              <div
                key={`${r.house}-${r.game}-${r.type}`}
                className={`flex items-center justify-between p-2.5 rounded-lg border ${
                  positive
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : 'bg-red-500/10 border-red-500/20'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-6 h-6 shrink-0 flex items-center justify-center rounded-full text-xs font-bold ${
                      positive
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {r.house} • {r.game}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {entryTypeLabels[r.type as keyof typeof entryTypeLabels] || r.type} · {r.count}x · média{' '}
                      {r.avg.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                  </div>
                </div>
                <div
                  className={`flex items-center gap-1 font-semibold text-sm shrink-0 ${
                    positive ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {positive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {r.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}