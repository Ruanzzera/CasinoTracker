import { Activity, Trophy, TrendingUp, Calendar } from 'lucide-react';
import { Tournament } from '@/hooks/useTournaments';
import { TournamentScheduleItem, getNextOccurrence } from '@/hooks/useTournamentSchedule';
import { monthKeyBRT, nowBRT } from '@/lib/timezone';

const fmtBRL = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface Props {
  tournaments: Tournament[];
  getStats: (id: string) => any;
  schedule: TournamentScheduleItem[];
}

export function TournamentKpiBar({ tournaments, getStats, schedule }: Props) {
  const month = monthKeyBRT();
  const active = tournaments.filter(t => !t.finalizedMonth);
  const finalizedThisMonth = tournaments.filter(t => t.finalizedMonth === month);

  const activeInvested = active.reduce((sum, t) => {
    const s = getStats(t.id);
    return sum + (s?.totalLoss || 0);
  }, 0);

  const monthResult = finalizedThisMonth.reduce((sum, t) => {
    const s = getStats(t.id);
    if (!s) return sum;
    return sum + (s.prizeValue - s.totalLoss);
  }, 0);

  const last30 = tournaments.filter(t => {
    if (!t.finalizedMonth) return false;
    const d = new Date(t.endDate);
    const diff = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 30;
  });
  const totalInv = last30.reduce((s, t) => s + (getStats(t.id)?.totalLoss || 0), 0);
  const totalPrize = last30.reduce((s, t) => s + (getStats(t.id)?.prizeValue || 0), 0);
  const roi = totalInv > 0 ? ((totalPrize - totalInv) / totalInv) * 100 : 0;

  const upcoming = schedule
    .filter(i => i.isActive)
    .map(i => ({ item: i, next: getNextOccurrence(i) }))
    .filter(x => x.next && x.next >= nowBRT())
    .sort((a, b) => a.next!.getTime() - b.next!.getTime())[0];

  let nextLabel = '—';
  let nextHint = 'Sem agendamentos';
  if (upcoming && upcoming.next) {
    const diffMs = upcoming.next.getTime() - Date.now();
    const hours = Math.round(diffMs / 3600000);
    nextLabel = hours < 24 ? `em ${hours}h` : `em ${Math.round(hours / 24)}d`;
    nextHint = upcoming.item.name || upcoming.item.house || 'Torneio';
  }

  const kpis = [
    { icon: Activity, label: 'Ativos agora', value: String(active.length), hint: `Investido: ${fmtBRL(activeInvested)}`, accent: 'text-primary' },
    { icon: Trophy, label: 'Resultado do mês', value: fmtBRL(monthResult), hint: `${finalizedThisMonth.length} finalizados`, accent: monthResult >= 0 ? 'text-primary' : 'text-destructive' },
    { icon: TrendingUp, label: 'ROI 30d', value: `${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%`, hint: last30.length ? `${last30.length} torneios` : 'Sem dados', accent: roi >= 0 ? 'text-primary' : 'text-destructive' },
    { icon: Calendar, label: 'Próximo evento', value: nextLabel, hint: nextHint, accent: 'text-foreground' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map((k, i) => {
        const Icon = k.icon;
        return (
          <div key={i} className="rounded-xl border border-border bg-card p-3 sm:p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Icon className="w-4 h-4" />
              <span className="truncate">{k.label}</span>
            </div>
            <p className={`text-xl sm:text-2xl font-bold mt-1 truncate ${k.accent}`}>{k.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{k.hint}</p>
          </div>
        );
      })}
    </div>
  );
}