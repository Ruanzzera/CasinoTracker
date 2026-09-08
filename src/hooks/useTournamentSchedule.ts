import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { nowBRT, getDayBRT } from '@/lib/timezone';
import { useAuth } from '@/hooks/useAuth';
import { useSharedQuery } from '@/lib/sharedQuery';


export interface TournamentScheduleItem {
  id: string;
  userId: string;
  house: string;
  name: string;
  scheduleType: 'specific' | 'recurring';
  specificDate: string | null;
  dayOfWeek: number | null;
  timeOfDay: string | null;
  isActive: boolean;
  createdAt: string;
}

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function getNextOccurrence(item: TournamentScheduleItem): Date | null {
  const now = nowBRT();
  if (item.scheduleType === 'specific' && item.specificDate) {
    return new Date(item.specificDate);
  }
  if (item.scheduleType === 'recurring' && item.dayOfWeek !== null) {
    const todayDow = getDayBRT();
    let diff = item.dayOfWeek - todayDow;
    if (diff < 0) diff += 7;
    if (diff === 0 && item.timeOfDay) {
      const [h, m] = item.timeOfDay.split(':').map(Number);
      const eventTime = new Date(now);
      eventTime.setHours(h, m, 0, 0);
      if (eventTime < now) diff = 7;
    }
    const next = new Date(now);
    next.setDate(next.getDate() + diff);
    if (item.timeOfDay) {
      const [h, m] = item.timeOfDay.split(':').map(Number);
      next.setHours(h, m, 0, 0);
    }
    return next;
  }
  return null;
}

export function formatScheduleLabel(item: TournamentScheduleItem): string {
  if (item.scheduleType === 'specific' && item.specificDate) {
    const d = new Date(item.specificDate);
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }
  if (item.scheduleType === 'recurring' && item.dayOfWeek !== null) {
    const day = DAY_LABELS[item.dayOfWeek] || '?';
    const time = item.timeOfDay ? item.timeOfDay.slice(0, 5) : '';
    return `Toda ${day} ${time}`;
  }
  return '';
}

export const DAY_OF_WEEK_LABELS = DAY_LABELS;

export function useTournamentSchedule() {
  const { user } = useAuth();

  const fetcher = useCallback(async (): Promise<TournamentScheduleItem[]> => {
    const { data, error } = await supabase
      .from('tournament_schedule')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300);
    if (error) throw error;
    return (data || []).map(r => ({
      id: r.id,
      userId: r.user_id,
      house: r.house,
      name: r.name,
      scheduleType: r.schedule_type as 'specific' | 'recurring',
      specificDate: r.specific_date,
      dayOfWeek: r.day_of_week,
      timeOfDay: r.time_of_day,
      isActive: r.is_active,
      createdAt: r.created_at,
    }));
  }, []);

  const { data, loading, update, refresh } = useSharedQuery<TournamentScheduleItem[]>(
    'tournament_schedule',
    fetcher,
    { ttlMs: 5 * 60 * 1000, enabled: !!user },
  );
  const items = data || [];
  const setItems = useCallback((fn: (prev: TournamentScheduleItem[]) => TournamentScheduleItem[]) => {
    update(prev => fn(prev || []));
  }, [update]);


  const addItem = useCallback(async (item: Omit<TournamentScheduleItem, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    const { data, error } = await supabase.from('tournament_schedule').insert({
      user_id: user.id,
      house: item.house,
      name: item.name,
      schedule_type: item.scheduleType,
      specific_date: item.specificDate,
      day_of_week: item.dayOfWeek,
      time_of_day: item.timeOfDay,
      is_active: item.isActive,
    }).select().single();
    if (error) { toast.error('Erro ao salvar agenda'); return; }
    toast.success('Agenda salva!');
    if (data) {
      setItems(prev => [{
        id: data.id,
        userId: data.user_id,
        house: data.house,
        name: data.name,
        scheduleType: data.schedule_type as 'specific' | 'recurring',
        specificDate: data.specific_date,
        dayOfWeek: data.day_of_week,
        timeOfDay: data.time_of_day,
        isActive: data.is_active,
        createdAt: data.created_at,
      }, ...prev]);
    }
  }, [user, setItems]);

  const deleteItem = useCallback(async (id: string) => {
    const { error } = await supabase.from('tournament_schedule').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); return; }
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success('Agenda excluída');
  }, [setItems]);

  const getUpcomingEvents = useCallback((withinDays = 3) => {
    const now = nowBRT();
    const limit = new Date(now);
    limit.setDate(limit.getDate() + withinDays);
    return items
      .filter(i => i.isActive)
      .map(i => ({ item: i, next: getNextOccurrence(i) }))
      .filter(({ next }) => next && next >= now && next <= limit)
      .sort((a, b) => (a.next!.getTime() - b.next!.getTime()));
  }, [items]);

  return { items, loading, addItem, deleteItem, getUpcomingEvents, refetch: refresh };
}
