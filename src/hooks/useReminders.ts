import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CasinoReminder } from '@/types/casino';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useSharedQuery } from '@/lib/sharedQuery';
import { useSharedLibrary } from '@/hooks/useSharedLibrary';
import { getDayBRT } from '@/lib/timezone';

const REMINDERS_KEY = 'casino_reminders';
const TTL_MS = 5 * 60 * 1000;

// Somente as colunas usadas pela tela (evita trazer a linha inteira).
const COLUMNS = 'id, user_id, house, title, description, days_of_week, reminder_time, is_active, created_at';

export const useReminders = () => {
  const { user } = useAuth();
  // Casas vêm da biblioteca compartilhada (já em cache) em vez de varrer as entradas.
  const { houses } = useSharedLibrary();

  const fetcher = useCallback(async (): Promise<CasinoReminder[]> => {
    const { data, error } = await supabase
      .from('casino_reminders')
      .select(COLUMNS)
      .order('reminder_time', { ascending: true });

    if (error) {
      console.error('Error fetching reminders:', error?.message);
      toast.error('Erro ao carregar lembretes');
      throw error;
    }

    return (data || []).map(r => ({
      id: r.id,
      userId: r.user_id,
      house: r.house,
      title: r.title,
      description: r.description || undefined,
      daysOfWeek: r.days_of_week || [],
      reminderTime: r.reminder_time,
      isActive: r.is_active,
      createdAt: new Date(r.created_at),
    }));
  }, []);

  const { data, loading, refresh, update } = useSharedQuery<CasinoReminder[]>(
    REMINDERS_KEY,
    fetcher,
    { ttlMs: TTL_MS, enabled: !!user },
  );

  const reminders = data || [];

  /* ===== CÓDIGO ANTIGO (varredura de casino_entries só para listar casas) =====
  const fetchHouses = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('casino_entries').select('house').eq('user_id', user.id);
    ...
  }, [user]);
  ===== FIM CÓDIGO ANTIGO ===== */

  const addReminder = useCallback(async (reminder: Omit<CasinoReminder, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    const { data: row, error } = await supabase
      .from('casino_reminders')
      .insert({
        user_id: user.id,
        house: reminder.house,
        title: reminder.title,
        description: reminder.description || null,
        days_of_week: reminder.daysOfWeek,
        reminder_time: reminder.reminderTime,
        is_active: reminder.isActive,
      })
      .select(COLUMNS)
      .single();

    if (error) {
      toast.error('Erro ao criar lembrete');
      console.error(error?.message);
      return;
    }

    const newReminder: CasinoReminder = {
      id: row.id,
      userId: row.user_id,
      house: row.house,
      title: row.title,
      description: row.description || undefined,
      daysOfWeek: row.days_of_week || [],
      reminderTime: row.reminder_time,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
    };

    update(prev => [...(prev || []), newReminder].sort((a, b) => a.reminderTime.localeCompare(b.reminderTime)));
    toast.success('Lembrete criado!');
  }, [user, update]);

  const updateReminder = useCallback(async (id: string, updates: Partial<CasinoReminder>) => {
    const { error } = await supabase
      .from('casino_reminders')
      .update({
        house: updates.house,
        title: updates.title,
        description: updates.description || null,
        days_of_week: updates.daysOfWeek,
        reminder_time: updates.reminderTime,
        is_active: updates.isActive,
      })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao atualizar lembrete');
      return;
    }

    update(prev => (prev || []).map(r => r.id === id ? { ...r, ...updates } : r));
    toast.success('Lembrete atualizado!');
  }, [update]);

  const deleteReminder = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('casino_reminders')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao deletar lembrete');
      return;
    }

    update(prev => (prev || []).filter(r => r.id !== id));
    toast.success('Lembrete removido!');
  }, [update]);

  const toggleReminder = useCallback(async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;
    await updateReminder(id, { isActive: !reminder.isActive });
  }, [reminders, updateReminder]);

  const getTodayReminders = useCallback(() => {
    const today = getDayBRT();
    return reminders.filter(r => r.isActive && r.daysOfWeek.includes(today));
  }, [reminders]);

  return {
    reminders,
    loading,
    houses,
    addReminder,
    updateReminder,
    deleteReminder,
    toggleReminder,
    getTodayReminders,
    refetch: refresh,
  };
};
