import { useMemo, useState } from 'react';
import { Target, Flame, BarChart3, Trophy, TrendingDown } from 'lucide-react';
import { toBRT } from '@/lib/timezone';
import type { RouletteMatch } from '@/hooks/useRoulette';

interface Props {
  matches: RouletteMatch[];
  initialBankroll: number;
  currentBankroll: number;
}

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const hours = Array.from({ length: 24 }, (_, i) => i);

export function RouletteMetrics({ matches: allMatches, initialBankroll, currentBankroll }: Props) {
  const modeNames = useMemo(() => Array.from(new Set(allMatches.map(m => m.modeName))).sort(), [allMatches]);
  const [modeFilter, setModeFilter] = useState<string>('all');
  const matches = useMemo(
    () => modeFilter === 'all' ? allMatches : allMatches.filter(m => m.modeName === modeFilter),
    [allMatches, modeFilter],
  );
  const stats = useMemo(() => {
    const total = matches.length;
    const wins2 = matches.filter(m => m.score === '2-0').length;
    const ties = matches.filter(m => m.score === '1-1').length;
    const losses = matches.filter(m => m.score === '0-2').length;
    const winRate = total > 0 ? (wins2 / total) * 100 : 0;
    const totalProfit = matches.reduce((a, m) => a + m.profit, 0);
    const avgProfit = total > 0 ? totalProfit / total : 0;

    // streak (most recent first)
    let streak = 0; let streakType: 'W' | 'L' | null = null;
    for (const m of matches) {
      const t: 'W' | 'L' | null = m.profit > 0 ? 'W' : m.profit < 0 ? 'L' : null;
      if (t === null) break;
      if (streakType === null) { streakType = t; streak = 1; }
      else if (t === streakType) streak++;
      else break;
    }

    const dayMap = new Map<string, number>();
    matches.forEach(m => dayMap.set(m.matchDate, (dayMap.get(m.matchDate) ?? 0) + m.profit));
    let bestDay: [string, number] | null = null;
    let worstDay: [string, number] | null = null;
    dayMap.forEach((v, k) => {
      if (!bestDay || v > bestDay[1]) bestDay = [k, v];
      if (!worstDay || v < worstDay[1]) worstDay = [k, v];
    });

    const roi = initialBankroll > 0 ? ((currentBankroll - initialBankroll) / initialBankroll) * 100 : 0;

    return { total, wins2, ties, losses, winRate, totalProfit, avgProfit, streak, streakType, bestDay, worstDay, roi };
  }, [matches, initialBankroll, currentBankroll]);

  const heatmap = useMemo(() => {
    const matrix: { total: number; count: number }[][] = Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => ({ total: 0, count: 0 }))
    );
    matches.forEach(m => {
      const d = toBRT(m.startedAt);
      matrix[d.getDay()][d.getHours()].total += m.profit;
      matrix[d.getDay()][d.getHours()].count += 1;
    });
    return matrix;
  }, [matches]);

  const max = Math.max(1, ...heatmap.flat().map(c => c.total));
  const min = Math.min(0, ...heatmap.flat().map(c => c.total));

  const colorFor = (total: number, count: number) => {
    if (count === 0) return 'bg-secondary';
    if (total < 0) {
      const n = Math.abs(total) / Math.max(1, Math.abs(min));
      if (n < 0.33) return 'bg-red-900/60';
      if (n < 0.66) return 'bg-red-700/70';
      return 'bg-red-500/80';
    }
    const n = total / max;
    if (n < 0.25) return 'bg-emerald-900/50';
    if (n < 0.5) return 'bg-emerald-700/60';
    if (n < 0.75) return 'bg-emerald-500/70';
    return 'bg-emerald-400/80';
  };

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-4">
      {modeNames.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setModeFilter('all')}
            className={`text-xs px-3 py-1 rounded-full border transition ${
              modeFilter === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >Todos</button>
          {modeNames.map(n => (
            <button
              key={n}
              onClick={() => setModeFilter(n)}
              className={`text-xs px-3 py-1 rounded-full border transition ${
                modeFilter === n ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >{n}</button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="stat-card">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Target className="w-3.5 h-3.5" /> Win rate (2-0)</div>
          <div className="text-xl font-bold">{stats.winRate.toFixed(1)}%</div>
          <div className="text-[10px] text-muted-foreground">{stats.wins2}W / {stats.ties}E / {stats.losses}L</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><BarChart3 className="w-3.5 h-3.5" /> Lucro médio</div>
          <div className={`text-xl font-bold ${stats.avgProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(stats.avgProfit)}</div>
          <div className="text-[10px] text-muted-foreground">{stats.total} partidas</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Flame className="w-3.5 h-3.5" /> Sequência</div>
          <div className={`text-xl font-bold ${stats.streakType === 'W' ? 'text-emerald-400' : stats.streakType === 'L' ? 'text-red-400' : ''}`}>
            {stats.streak > 0 ? `${stats.streak}${stats.streakType}` : '—'}
          </div>
          <div className="text-[10px] text-muted-foreground">atual</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Trophy className="w-3.5 h-3.5 text-yellow-500" /> Melhor dia</div>
          <div className="text-base font-bold text-emerald-400">{stats.bestDay ? fmt(stats.bestDay[1]) : '—'}</div>
          <div className="text-[10px] text-muted-foreground">{stats.bestDay?.[0] ?? ''}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><TrendingDown className="w-3.5 h-3.5 text-red-500" /> Pior dia</div>
          <div className="text-base font-bold text-red-400">{stats.worstDay ? fmt(stats.worstDay[1]) : '—'}</div>
          <div className="text-[10px] text-muted-foreground">{stats.worstDay?.[0] ?? ''}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><BarChart3 className="w-3.5 h-3.5" /> ROI projeto</div>
          <div className={`text-xl font-bold ${stats.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {stats.roi >= 0 ? '+' : ''}{stats.roi.toFixed(1)}%
          </div>
          <div className="text-[10px] text-muted-foreground">sobre banca inicial</div>
        </div>
      </div>

      <div className="stat-card">
        <h3 className="text-lg font-semibold mb-2">Heatmap de horários</h3>
        <p className="text-xs text-muted-foreground mb-3">Soma de lucro por dia da semana e hora (apenas MD3s).</p>
        {matches.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Sem dados ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="flex">
                <div className="w-10 shrink-0" />
                {hours.map(h => (
                  <div key={h} className="flex-1 text-center text-[10px] text-muted-foreground pb-1">
                    {h.toString().padStart(2, '0')}
                  </div>
                ))}
              </div>
              {weekDays.map((day, di) => (
                <div key={day} className="flex items-center">
                  <div className="w-10 shrink-0 text-[10px] text-muted-foreground pr-1 text-right">{day}</div>
                  {hours.map(h => {
                    const c = heatmap[di][h];
                    return (
                      <div
                        key={h}
                        title={c.count > 0 ? `${day} ${h}h\n${c.count} partidas\n${fmt(c.total)}` : `${day} ${h}h\nsem dados`}
                        className={`flex-1 aspect-square m-[1px] rounded-sm ${colorFor(c.total, c.count)}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}