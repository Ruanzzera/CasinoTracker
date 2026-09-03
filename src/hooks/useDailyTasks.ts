import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { todayBRT } from '@/lib/timezone';
import { AccountName } from '@/types/casino';
import { EntryType } from '@/types/casino';

export interface DailyTask {
  id: string;
  title: string;
  description?: string | null;
  house?: string | null;
  entryType?: EntryType | null;
  accounts: AccountName[];
  isActive: boolean;
  sortOrder: number;
}

export interface TaskInput {
  title: string;
  description?: string;
  house?: string;
  entryType?: EntryType | '';
  accounts: AccountName[];
  isActive?: boolean;
}

export const useDailyTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [completions, setCompletions] = useState<Set<string>>(new Set()); // `${task_id}:${account}`
  const [loading, setLoading] = useState(true);
  const today = todayBRT();

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const [{ data: t }, { data: c }] = await Promise.all([
      supabase.from('daily_tasks').select('*').eq('user_id', user.id).order('sort_order').order('created_at'),
      supabase.from('daily_task_completions').select('task_id, account').eq('user_id', user.id).eq('done_date', today),
    ]);
    setTasks((t || []).map(r => ({
      id: r.id, title: r.title, description: r.description, house: r.house,
      entryType: ((r as any).entry_type as EntryType) || null,
      accounts: (r.accounts as AccountName[]) || [], isActive: r.is_active, sortOrder: r.sort_order,
    })));
    setCompletions(new Set((c || []).map(x => `${x.task_id}:${x.account}`)));
    setLoading(false);
  }, [user, today]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addTask = useCallback(async (input: TaskInput) => {
    if (!user) return;
    const { data, error } = await supabase.from('daily_tasks').insert({
      user_id: user.id, title: input.title, description: input.description || null,
      house: input.house || null, accounts: input.accounts, is_active: input.isActive ?? true,
      entry_type: input.entryType || null,
    }).select().single();
    if (error) { toast.error('Erro ao criar tarefa'); return; }
    setTasks(p => [...p, { id: data.id, title: data.title, description: data.description, house: data.house, entryType: ((data as any).entry_type as EntryType) || null, accounts: (data.accounts as AccountName[])||[], isActive: data.is_active, sortOrder: data.sort_order }]);
    toast.success('Tarefa criada');
  }, [user]);

  const updateTask = useCallback(async (id: string, input: TaskInput) => {
    const { error } = await supabase.from('daily_tasks').update({
      title: input.title, description: input.description || null,
      house: input.house || null, accounts: input.accounts, is_active: input.isActive ?? true,
      entry_type: input.entryType || null,
    }).eq('id', id);
    if (error) { toast.error('Erro ao atualizar'); return; }
    setTasks(p => p.map(t => t.id === id ? { ...t, ...input, description: input.description || null, house: input.house || null, entryType: (input.entryType as EntryType) || null, isActive: input.isActive ?? true } : t));
    toast.success('Tarefa atualizada');
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    const { error } = await supabase.from('daily_tasks').delete().eq('id', id);
    if (error) { toast.error('Erro ao remover'); return; }
    setTasks(p => p.filter(t => t.id !== id));
    toast.success('Tarefa removida');
  }, []);

  const toggleCompletion = useCallback(async (taskId: string, account: AccountName) => {
    if (!user) return;
    const key = `${taskId}:${account}`;
    const isDone = completions.has(key);
    // optimistic
    setCompletions(prev => {
      const next = new Set(prev);
      if (isDone) next.delete(key); else next.add(key);
      return next;
    });
    if (isDone) {
      const { error } = await supabase.from('daily_task_completions').delete()
        .eq('task_id', taskId).eq('account', account).eq('done_date', today).eq('user_id', user.id);
      if (error) { toast.error('Erro'); setCompletions(p => new Set(p).add(key)); }
    } else {
      const { error } = await supabase.from('daily_task_completions').insert({
        user_id: user.id, task_id: taskId, account, done_date: today,
      });
      if (error) {
        toast.error('Erro');
        setCompletions(prev => { const n = new Set(prev); n.delete(key); return n; });
      }
    }
  }, [user, today, completions]);

  const isDone = (taskId: string, account: AccountName) => completions.has(`${taskId}:${account}`);

  return { tasks, loading, addTask, updateTask, deleteTask, toggleCompletion, isDone, refetch: fetchAll };
};