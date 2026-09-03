import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import type { BetAndWinEntry } from '@/hooks/useBetAndWin';

export function HouseGameStatsCard({ entries }: { entries: BetAndWinEntry[] }) {
  const stats = useMemo(() => {
    const byHouse = new Map<string, { profit: number; count: number }>();
    const byHouseGame = new Map<string, { house: string; game: string; profit: number; count: number }>();
    for (const e of entries) {
      const balance = (e.finalBankroll - e.initialBankroll) + e.spinPrize;
      const h = byHouse.get(e.house) || { profit: 0, count: 0 };
      h.profit += balance; h.count += 1;
      byHouse.set(e.house, h);

      const game = e.prizeGame || e.rolloverGame || '—';
      const key = `${e.house}|${game}`;
      const hg = byHouseGame.get(key) || { house: e.house, game, profit: 0, count: 0 };
      hg.profit += balance; hg.count += 1;
      byHouseGame.set(key, hg);
    }
    const houses = Array.from(byHouse.entries())
      .map(([house, v]) => ({ house, ...v, avg: v.profit / v.count }))
      .sort((a, b) => b.profit - a.profit);
    const games = Array.from(byHouseGame.values())
      .sort((a, b) => b.profit - a.profit);
    return { houses, games: games.slice(0, 5) };
  }, [entries]);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (entries.length === 0) return null;

  return (
    <div className="rounded-lg border border-border/60 bg-card/60 p-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
        <TrendingUp className="w-3.5 h-3.5" /> O que compensa
      </h3>
      <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Por Casa</p>
          <div className="space-y-1">
            {stats.houses.map(h => (
              <div key={h.house} className="flex items-center justify-between rounded border border-border/60 bg-muted/10 px-2 py-1.5 text-xs">
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-foreground truncate">{h.house}</span>
                  <span className="text-[9px] text-muted-foreground">{h.count}x · méd {fmt(h.avg)}</span>
                </div>
                <span className={`font-bold text-xs ${h.profit >= 0 ? 'text-primary' : 'text-destructive'}`}>{fmt(h.profit)}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Casa + Jogo</p>
          <div className="space-y-1">
            {stats.games.map(g => (
              <div key={`${g.house}-${g.game}`} className="flex items-center justify-between rounded border border-border/60 bg-muted/10 px-2 py-1.5 text-xs">
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-foreground truncate">{g.house}</span>
                  <span className="text-[9px] text-muted-foreground truncate">{g.game} · {g.count}x</span>
                </div>
                <span className={`font-bold text-xs ${g.profit >= 0 ? 'text-primary' : 'text-destructive'}`}>{fmt(g.profit)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}