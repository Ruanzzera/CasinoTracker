import { useEffect, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell, AlarmClock, Building2, Clock } from 'lucide-react';
import { useReminders } from '@/hooks/useReminders';
import { CasinoReminder } from '@/types/casino';
import { getDayBRT, currentTimeBRT } from '@/lib/timezone';
import { getAckedToday, ackReminder, ackAll, subscribeAck } from '@/lib/reminderAck';

const CHECK_MS = 20000;
const ADVANCE_MIN = 5; // start nagging 5 minutes before

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const PendingRemindersPopup = ({ enabled }: { enabled: boolean }) => {
  const { reminders } = useReminders();
  const [pending, setPending] = useState<CasinoReminder[]>([]);
  const [tick, setTick] = useState(0);

  const recompute = useCallback(() => {
    if (!enabled) { setPending([]); return; }
    const day = getDayBRT();
    const nowMin = toMin(currentTimeBRT());
    const acked = getAckedToday();
    const due = reminders.filter(r =>
      r.isActive &&
      r.daysOfWeek.includes(day) &&
      toMin(r.reminderTime) - ADVANCE_MIN <= nowMin &&
      !acked.has(r.id)
    );
    setPending(due);
  }, [reminders, enabled]);

  useEffect(() => { recompute(); }, [recompute, tick]);

  useEffect(() => {
    const id = window.setInterval(() => setTick(t => t + 1), CHECK_MS);
    const unsub = subscribeAck(() => setTick(t => t + 1));
    const onVis = () => !document.hidden && setTick(t => t + 1);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      unsub();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const open = pending.length > 0;

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-md border-primary/40 shadow-[0_0_40px_hsl(var(--primary)/0.4)]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <AlarmClock className="w-5 h-5 animate-pulse" />
            Lembretes pendentes ({pending.length})
          </DialogTitle>
          <DialogDescription>
            Confirme cada lembrete realizado para parar os avisos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
          {pending.map(r => (
            <div key={r.id} className="rounded-lg border border-border bg-card p-3 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="truncate">{r.house}</span>
                  <span>•</span>
                  <Clock className="w-3.5 h-3.5" />
                  <span className="font-mono">{r.reminderTime.slice(0, 5)}</span>
                </div>
                <p className="font-medium text-foreground truncate">{r.title}</p>
                {r.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{r.description}</p>
                )}
              </div>
              <Button size="sm" onClick={() => ackReminder(r.id)} className="shrink-0">
                OK
              </Button>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            className="w-full sm:w-auto gap-2"
            onClick={() => { window.location.href = '/notifications'; }}
          >
            <Bell className="w-4 h-4" />
            Abrir Notificações
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={() => ackAll(pending.map(r => r.id))}
          >
            Marcar todos como realizados
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};