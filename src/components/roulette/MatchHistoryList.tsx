import { useState } from 'react';
import { Trash2, ChevronLeft, ChevronRight, History, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDateBRT } from '@/lib/timezone';
import type { RouletteMatch } from '@/hooks/useRoulette';

interface Props {
  matches: RouletteMatch[];
  onDelete: (id: string) => void;
}

const PAGE_SIZE = 20;

export function MatchHistoryList({ matches, onDelete }: Props) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const pageItems = matches.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Histórico</h3>
        </div>
        <span className="text-xs text-muted-foreground">{matches.length} partidas</span>
      </div>

      {matches.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Sem partidas registradas ainda.</p>
      ) : (
        <>
          <div className="space-y-2">
            {pageItems.map(m => (
              <div
                key={m.id}
                className="flex items-start justify-between gap-2 p-3 rounded-lg bg-secondary/40 border border-border/50 hover:bg-secondary/60 transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold">{m.score || '—'}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">
                      {m.modeName} {m.payoutMultiplier}×
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateBRT(m.startedAt, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-[10px] mt-1 flex gap-1">
                    {m.spins.map(s => (
                      <span
                        key={s.id}
                        className={`inline-flex items-center justify-center gap-0.5 px-1 h-4 rounded-sm text-[9px] font-bold ${
                          s.result === 'W'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {s.result}{s.galeCount > 0 && (<><Zap className="w-2.5 h-2.5 text-yellow-400" />{s.galeCount}</>)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`font-bold text-sm ${m.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {m.profit >= 0 ? '+' : ''}{m.profit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => { if (confirm('Excluir esta partida?')) onDelete(m.id); }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                Página {page + 1} de {totalPages}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}