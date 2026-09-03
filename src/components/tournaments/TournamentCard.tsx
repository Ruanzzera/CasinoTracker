import { Tournament } from '@/hooks/useTournaments';
import { TournamentScheduleItem, getNextOccurrence, formatScheduleLabel } from '@/hooks/useTournamentSchedule';
import { Trash2, ArrowUp, ArrowDown, Minus, Trophy, Calendar, Pencil, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const fmtBRL = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function ActiveTournamentCard({ t, stats, onClick }: { t: Tournament; stats: any; onClick: () => void }) {
  const target = t.targetPoints || (t.pointsPlayerAbove > 0 ? t.pointsPlayerAbove : stats?.totalPoints || 1);
  const pct = Math.min(100, target > 0 ? ((stats?.totalPoints || 0) / target) * 100 : 0);
  const posDelta = t.initialPosition - t.currentPosition;
  const PosIcon = posDelta > 0 ? ArrowUp : posDelta < 0 ? ArrowDown : Minus;
  const posColor = posDelta > 0 ? 'text-primary' : posDelta < 0 ? 'text-destructive' : 'text-muted-foreground';
  const inPrize = stats?.inPrizeRange;

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg border border-border bg-card p-3 hover:border-primary transition space-y-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold text-sm text-foreground truncate">{t.name || 'Torneio'}</div>
          <div className="text-xs text-muted-foreground truncate">{t.house}</div>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${inPrize ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}`}>
          {inPrize ? 'no prêmio' : 'fora'}
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{(stats?.totalPoints || 0).toFixed(0)} pts</span>
          <span className={`flex items-center gap-1 font-semibold ${posColor}`}>
            <PosIcon className="w-3 h-3" />
            {t.currentPosition}º
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 text-[10px] pt-1 border-t border-border/50">
        <div>
          <div className="text-muted-foreground">Inv.</div>
          <div className="font-semibold text-destructive truncate">{fmtBRL(stats?.totalLoss || 0)}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Prêmio</div>
          <div className="font-semibold text-primary truncate">{fmtBRL(stats?.prizeValue || 0)}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Saldo</div>
          <div className={`font-semibold truncate ${(stats?.projectedNetResult || 0) >= 0 ? 'text-primary' : 'text-destructive'}`}>
            {fmtBRL(stats?.projectedNetResult || 0)}
          </div>
        </div>
      </div>
    </button>
  );
}

export function FinalizedTournamentCard({ t, stats, onClick, onEditWinnings }: { t: Tournament; stats: any; onClick: () => void; onEditWinnings?: () => void }) {
  const balance = (stats?.prizeValue || 0) - (stats?.totalLoss || 0);
  const roi = (stats?.totalLoss || 0) > 0 ? (balance / stats.totalLoss) * 100 : 0;
  const missingActual = t.actualWinnings === null || t.actualWinnings === undefined;
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg border border-border bg-card p-3 hover:border-primary transition"
    >
      <div className="flex items-center gap-2 mb-1">
        <Trophy className="w-3 h-3 text-primary shrink-0" />
        <span className="font-medium text-sm text-foreground truncate">{t.name || 'Torneio'}</span>
        {onEditWinnings && (
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onEditWinnings(); }}
            className="ml-auto text-muted-foreground hover:text-primary p-1 -m-1"
            title="Corrigir ganho real"
          >
            <Pencil className="w-3 h-3" />
          </span>
        )}
      </div>
      <div className="text-xs text-muted-foreground truncate">{t.house}</div>
      <div className="flex items-center justify-between mt-2">
        <span className={`font-bold text-sm ${balance >= 0 ? 'text-primary' : 'text-destructive'}`}>
          {balance >= 0 ? '+' : ''}{fmtBRL(balance)}
        </span>
        <span className={`text-xs ${roi >= 0 ? 'text-primary' : 'text-destructive'}`}>
          {roi >= 0 ? '+' : ''}{roi.toFixed(0)}%
        </span>
      </div>
      {missingActual && (
        <div className="text-[10px] text-amber-500 mt-1">⚠ usando prêmio teórico — clique no lápis para informar o ganho real</div>
      )}
    </button>
  );
}

export function ScheduledItemCard({ item, onDelete, onStart }: { item: TournamentScheduleItem; onDelete: () => void; onStart?: () => void }) {
  const next = getNextOccurrence(item);
  let inLabel = formatScheduleLabel(item);
  if (next) {
    const diffMs = next.getTime() - Date.now();
    const hours = Math.round(diffMs / 3600000);
    if (hours >= 0 && hours < 72) {
      inLabel = hours < 24 ? `em ${hours}h` : `em ${Math.round(hours / 24)}d`;
    }
  }
  return (
    <div className="rounded-lg border border-border bg-card p-3 flex items-start justify-between gap-2">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Calendar className="w-3 h-3 text-primary shrink-0" />
          <span className="font-medium text-sm text-foreground truncate">{item.name || item.house || 'Torneio'}</span>
        </div>
        {item.house && <div className="text-xs text-muted-foreground truncate">{item.house}</div>}
        <div className="text-xs text-primary mt-1 truncate">{inLabel}</div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {onStart && (
          <Button
            variant="ghost"
            size="icon"
            className="text-primary h-7 w-7"
            onClick={onStart}
            title={item.scheduleType === 'recurring' ? 'Iniciar (mantém na agenda)' : 'Iniciar torneio'}
          >
            <Play className="w-3 h-3" />
          </Button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive h-7 w-7">
              <Trash2 className="w-3 h-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir agendamento?</AlertDialogTitle>
              <AlertDialogDescription>
                Isso remove "{item.name || item.house || 'Torneio'}" da agenda. Essa ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}