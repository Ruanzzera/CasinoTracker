import { Coins, MapPin, Target, TrendingUp, Trophy } from 'lucide-react';
import { Tournament } from '@/hooks/useTournaments';

const fmtBRL = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function TournamentRulesPanel({ t, stats }: { t: Tournament; stats: any }) {
  const rules = [
    {
      icon: Coins,
      label: 'Pontuação',
      text: <>Você ganha <strong className="text-foreground">{t.pointsPerReal}</strong> ponto(s) a cada <strong className="text-foreground">R$ 1,00</strong> apostado.</>,
    },
    {
      icon: MapPin,
      label: 'Posição atual',
      text: <>Você está em <strong className="text-foreground">{t.currentPosition}º</strong>{t.initialPosition > 0 ? <> (começou em {t.initialPosition}º)</> : null}.</>,
    },
    {
      icon: Target,
      label: 'Posição desejada',
      text: t.prizePositionCutoff > 0
        ? <>Premiação vai até a <strong className="text-foreground">{t.prizePositionCutoff}ª</strong> colocação.</>
        : <>Sem corte de posição definido (preencha "Premia até a colocação").</>,
    },
    {
      icon: TrendingUp,
      label: 'Posição possível',
      text: stats
        ? <>Com a banca atual você projeta ficar em <strong className="text-primary">{stats.projectedPosition}º</strong>{t.pointsPlayerAbove > 0 ? <> (ultrapassa quem está acima ao atingir <strong className="text-foreground">{t.pointsPlayerAbove.toFixed(0)}</strong> pts).</> : <>.</>}</>
        : '—',
    },
    {
      icon: Trophy,
      label: 'Prêmio',
      text: stats
        ? <>Se finalizar dentro do corte: <strong className="text-primary">{fmtBRL(stats.rawPrizeValue)}</strong> ({t.prizeType === 'giros' ? 'giros' : 'saldo real'}).</>
        : '—',
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Como funciona este torneio</h3>
      <ul className="space-y-2.5">
        {rules.map((r, i) => {
          const Icon = r.icon;
          return (
            <li key={i} className="flex items-start gap-3">
              <div className="rounded-md bg-muted p-1.5 shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0 text-sm text-muted-foreground leading-snug">
                <div className="text-xs uppercase tracking-wide text-muted-foreground/70">{r.label}</div>
                <div>{r.text}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}