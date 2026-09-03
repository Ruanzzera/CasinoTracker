import { useMemo } from 'react';
import { Users } from 'lucide-react';
import { CasinoEntry, ACCOUNTS, AccountName } from '@/types/casino';
import { toBRT } from '@/lib/timezone';

interface AccountComparisonProps {
  entries: CasinoEntry[];
}

const fmt = (n: number) =>
  `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function AccountComparison({ entries }: AccountComparisonProps) {
  const stats = useMemo(() => {
    const byAcc: Record<AccountName, {
      total: number;
      count: number;
      highest: number;
      dailyMap: Map<string, number>;
      monthlyMap: Map<string, number>;
      yearlyMap: Map<string, number>;
    }> = {
      Ruan: { total: 0, count: 0, highest: 0, dailyMap: new Map(), monthlyMap: new Map(), yearlyMap: new Map() },
      Rita: { total: 0, count: 0, highest: 0, dailyMap: new Map(), monthlyMap: new Map(), yearlyMap: new Map() },
    };

    entries.forEach((e) => {
      const acc: AccountName = e.account === 'Rita' ? 'Rita' : 'Ruan';
      const bucket = byAcc[acc];
      const d = toBRT(e.createdAt);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dayKey = `${y}-${m}-${day}`;
      const monthKey = `${y}-${m}`;
      const yearKey = `${y}`;

      bucket.total += e.amount;
      bucket.count += 1;
      if (e.amount > bucket.highest) bucket.highest = e.amount;
      bucket.dailyMap.set(dayKey, (bucket.dailyMap.get(dayKey) || 0) + e.amount);
      bucket.monthlyMap.set(monthKey, (bucket.monthlyMap.get(monthKey) || 0) + e.amount);
      bucket.yearlyMap.set(yearKey, (bucket.yearlyMap.get(yearKey) || 0) + e.amount);
    });

    const summarize = (acc: AccountName) => {
      const b = byAcc[acc];
      const bestDay = [...b.dailyMap.entries()].sort((a, b) => b[1] - a[1])[0];
      const bestMonth = [...b.monthlyMap.entries()].sort((a, b) => b[1] - a[1])[0];
      const bestYear = [...b.yearlyMap.entries()].sort((a, b) => b[1] - a[1])[0];
      const dailyAvg = b.dailyMap.size ? b.total / b.dailyMap.size : 0;
      const monthlyAvg = b.monthlyMap.size ? b.total / b.monthlyMap.size : 0;
      return {
        total: b.total,
        count: b.count,
        highest: b.highest,
        dailyAvg,
        monthlyAvg,
        bestDay: bestDay ? { key: bestDay[0], value: bestDay[1] } : null,
        bestMonth: bestMonth ? { key: bestMonth[0], value: bestMonth[1] } : null,
        bestYear: bestYear ? { key: bestYear[0], value: bestYear[1] } : null,
      };
    };

    return { Ruan: summarize('Ruan'), Rita: summarize('Rita') };
  }, [entries]);

  const grandTotal = stats.Ruan.total + stats.Rita.total;
  const share = (v: number) => (grandTotal !== 0 ? (v / grandTotal) * 100 : 0);

  const formatDayKey = (k: string) => {
    const [y, m, d] = k.split('-');
    return `${d}/${m}/${y.slice(2)}`;
  };
  const formatMonthKey = (k: string) => {
    const [y, m] = k.split('-');
    return `${m}/${y}`;
  };

  return (
    <div className="stat-card mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Comparativo por Conta</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ACCOUNTS.map((acc) => {
          const s = stats[acc];
          const isLeader = grandTotal !== 0 && s.total >= stats[acc === 'Ruan' ? 'Rita' : 'Ruan'].total;
          return (
            <div
              key={acc}
              className={`rounded-xl border p-4 bg-secondary/40 ${
                isLeader ? 'border-primary/60' : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-foreground">{acc}</span>
                  {isLeader && grandTotal !== 0 && (
                    <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                      Líder
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {s.count} entrada{s.count === 1 ? '' : 's'} · {share(s.total).toFixed(1)}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <Stat label="Total" value={fmt(s.total)} strong />
                <Stat label="Maior entrada" value={fmt(s.highest)} />
                <Stat
                  label="Melhor dia"
                  value={s.bestDay ? fmt(s.bestDay.value) : '—'}
                  hint={s.bestDay ? formatDayKey(s.bestDay.key) : undefined}
                />
                <Stat
                  label="Melhor mês"
                  value={s.bestMonth ? fmt(s.bestMonth.value) : '—'}
                  hint={s.bestMonth ? formatMonthKey(s.bestMonth.key) : undefined}
                />
                <Stat label="Média diária" value={fmt(s.dailyAvg)} />
                <Stat label="Média mensal" value={fmt(s.monthlyAvg)} />
                <Stat
                  label="Melhor ano"
                  value={s.bestYear ? fmt(s.bestYear.value) : '—'}
                  hint={s.bestYear?.key}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, hint, strong }: { label: string; value: string; hint?: string; strong?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={strong ? 'text-base font-bold gold-text' : 'text-sm font-semibold text-foreground'}>
        {value}
      </div>
      {hint && <div className="text-[10px] text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  );
}