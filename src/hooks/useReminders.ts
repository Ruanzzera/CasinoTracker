import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CasinoReminder } from '@/types/casino';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export const useReminders = () => {
  const [reminders, setReminders] = useState<CasinoReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [houses, setHouses] = useState<string[]>([]);
  const { user } = useAuth();

  const fetchReminders = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('casino_reminders')
      .select('*')
      .eq('user_id', user.id)
      .order('reminder_time', { ascending: true });

    if (error) {
      console.error('Error fetching reminders:', error?.message);
      toast.error('Erro ao carregar lembretes');
      return;
    }

    const formattedReminders: CasinoReminder[] = (data || []).map(r => ({
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

    setReminders(formattedReminders);
    setLoading(false);
  }, [user]);

  const fetchHouses = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from('casino_entries')
      .select('house')
      .eq('user_id', user.id);

    if (data) {
      const uniqueHouses = [...new Set(data.map(e => e.house))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
      setHouses(uniqueHouses);
    }
  }, [user]);

  useEffect(() => {
    fetchReminders();
    fetchHouses();
  }, [fetchReminders, fetchHouses]);

  const addReminder = useCallback(async (reminder: Omit<CasinoReminder, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    const { data, error } = await supabase
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
      .select()
      .single();

    if (error) {
      toast.error('Erro ao criar lembrete');
      console.error(error?.message);
      return;
    }

    const newReminder: CasinoReminder = {
      id: data.id,
      userId: data.user_id,
      house: data.house,
      title: data.title,
      description: data.description || undefined,
      daysOfWeek: data.days_of_week || [],
      reminderTime: data.reminder_time,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
    };

    setReminders(prev => [...prev, newReminder].sort((a, b) => a.reminderTime.localeCompare(b.reminderTime)));
    toast.success('Lembrete criado!');
  }, [user]);

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

    setReminders(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    toast.success('Lembrete atualizado!');
  }, []);

  const deleteReminder = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('casino_reminders')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao deletar lembrete');
      return;
    }

    setReminders(prev => prev.filter(r => r.id !== id));
    toast.success('Lembrete removido!');
  }, []);

  const toggleReminder = useCallback(async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    await updateReminder(id, { isActive: !reminder.isActive });
  }, [reminders, updateReminder]);

  const getTodayReminders = useCallback(() => {
    const today = new Date().getDay();
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
    refetch: fetchReminders,
  };
};
