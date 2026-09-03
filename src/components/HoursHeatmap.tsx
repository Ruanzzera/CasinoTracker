import { useMemo } from 'react';
import { CasinoEntry } from '@/types/casino';
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react';
import { toBRT } from '@/lib/timezone';

interface HoursHeatmapProps {
  entries: CasinoEntry[];
}

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const weekDaysFull = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const hours = Array.from({ length: 24 }, (_, i) => i);

interface HourRanking {
  dayOfWeek: number;
  hour: number;
  total: number;
  count: number;
}

export function HoursHeatmap({ entries }: HoursHeatmapProps) {
  const heatmapData = useMemo(() => {
    const matrix: { count: number; total: number }[][] = Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => ({ count: 0, total: 0 }))
    );

    entries.forEach(entry => {
      const date = toBRT(entry.createdAt);
      const dayOfWeek = date.getDay();
      const hour = date.getHours();
      matrix[dayOfWeek][hour].count += 1;
      matrix[dayOfWeek][hour].total += entry.amount;
    });

    return matrix;
  }, [entries]);

  const ranking = useMemo(() => {
    const allHours: HourRanking[] = [];
    
    heatmapData.forEach((row, dayIndex) => {
      row.forEach((cell, hourIndex) => {
        if (cell.count > 0) {
          allHours.push({
            dayOfWeek: dayIndex,
            hour: hourIndex,
            total: cell.total,
            count: cell.count
          });
        }
      });
    });

    // Sort by total (descending for best, ascending for worst)
    const sorted = [...allHours].sort((a, b) => b.total - a.total);
    
    return {
      best: sorted.slice(0, 5),
      worst: sorted.slice(-5).reverse()
    };
  }, [heatmapData]);

  const maxTotal = useMemo(() => {
    let max = 0;
    heatmapData.forEach(row => {
      row.forEach(cell => {
        if (cell.total > max) max = cell.total;
      });
    });
    return max;
  }, [heatmapData]);

  const minTotal = useMemo(() => {
    let min = Infinity;
    heatmapData.forEach(row => {
      row.forEach(cell => {
        if (cell.count > 0 && cell.total < min) min = cell.total;
      });
    });
    return min === Infinity ? 0 : min;
  }, [heatmapData]);

  const getColor = (total: number, count: number) => {
    if (count === 0) return 'bg-secondary';
    
    const range = maxTotal - minTotal;
    const normalized = range > 0 ? (total - minTotal) / range : 0.5;
    
    if (total < 0) {
      if (normalized < 0.33) return 'bg-red-900/60';
      if (normalized < 0.66) return 'bg-red-700/70';
      return 'bg-red-500/80';
    }
    
    if (normalized < 0.25) return 'bg-emerald-900/50';
    if (normalized < 0.5) return 'bg-emerald-700/60';
    if (normalized < 0.75) return 'bg-emerald-500/70';
    return 'bg-emerald-400/80';
  };

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Heatmap */}
      <div className="stat-card">
        <h3 className="text-lg font-semibold text-foreground mb-4">Heatmap de Horários</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Visualize seus melhores horários por dia da semana
        </p>
        
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="flex">
              <div className="w-12 shrink-0" />
              {hours.map(hour => (
                <div
                  key={hour}
                  className="flex-1 text-center text-xs text-muted-foreground pb-2"
                >
                  {hour.toString().padStart(2, '0')}
                </div>
              ))}
            </div>

            {weekDays.map((day, dayIndex) => (
              <div key={day} className="flex items-center">
                <div className="w-12 shrink-0 text-xs text-muted-foreground pr-2 text-right">
                  {day}
                </div>
                {hours.map(hour => {
                  const cell = heatmapData[dayIndex][hour];
                  return (
                    <div
                      key={hour}
                      className={`flex-1 aspect-square m-0.5 rounded-sm ${getColor(cell.total, cell.count)} transition-colors cursor-default group relative`}
                      title={
                        cell.count > 0
                          ? `${day} ${hour.toString().padStart(2, '0')}:00\n${cell.count} entradas\nR$ ${cell.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : `${day} ${hour.toString().padStart(2, '0')}:00\nSem dados`
                      }
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                        <div className="bg-popover border border-border rounded-md px-2 py-1 text-xs whitespace-nowrap shadow-lg">
                          <div className="font-medium text-foreground">{day} {hour.toString().padStart(2, '0')}:00</div>
                          {cell.count > 0 ? (
                            <>
                              <div className="text-muted-foreground">{cell.count} entradas</div>
                              <div className={cell.total >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                R$ {cell.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                            </>
                          ) : (
                            <div className="text-muted-foreground">Sem dados</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-secondary" />
            <span>Sem dados</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-red-500/80" />
            <span>Prejuízo</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-emerald-900/50" />
            <span>Baixo</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-emerald-400/80" />
            <span>Alto</span>
          </div>
        </div>
      </div>

      {/* Rankings */}
      {ranking.best.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Best Hours */}
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-semibold text-foreground">Melhores Horários</h3>
            </div>
            <div className="space-y-2">
              {ranking.best.map((item, index) => (
                <div
                  key={`${item.dayOfWeek}-${item.hour}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {weekDaysFull[item.dayOfWeek]} às {item.hour.toString().padStart(2, '0')}h
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.count} {item.count === 1 ? 'entrada' : 'entradas'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <TrendingUp className="w-4 h-4" />
                    R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Worst Hours */}
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-semibold text-foreground">Piores Horários</h3>
            </div>
            <div className="space-y-2">
              {ranking.worst.map((item, index) => (
                <div
                  key={`${item.dayOfWeek}-${item.hour}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-red-500/20 text-red-400 text-sm font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {weekDaysFull[item.dayOfWeek]} às {item.hour.toString().padStart(2, '0')}h
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.count} {item.count === 1 ? 'entrada' : 'entradas'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-red-400 font-semibold">
                    <TrendingDown className="w-4 h-4" />
                    R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}