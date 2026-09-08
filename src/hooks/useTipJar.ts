import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export interface TipJarEntry {
  id: string;
  userId: string;
  amount: number; // positive = income, negative = expense
  description?: string;
  sourceEntryId?: string;
  createdAt: Date;
}

export function useTipJar() {
  const [entries, setEntries] = useState<TipJarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchEntries = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('tip_jar_entries')
      .select('id, user_id, amount, description, source_entry_id, created_at')
      .order('created_at', { ascending: false })
      .limit(200);


    if (error) {
      console.error('Error fetching tip jar entries:', error?.message);
      toast.error('Erro ao carregar Tip Jar');
      setLoading(false);
      return;
    }

    const formatted: TipJarEntry[] = (data || []).map(e => ({
      id: e.id,
      userId: e.user_id,
      amount: Number(e.amount),
      description: e.description || undefined,
      sourceEntryId: e.source_entry_id || undefined,
      createdAt: new Date(e.created_at),
    }));

    setEntries(formatted);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const addIncome = useCallback(async (amount: number, description?: string, sourceEntryId?: string) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('tip_jar_entries')
      .insert({
        user_id: user.id,
        amount,
        description: description || 'Resto de entrada',
        source_entry_id: sourceEntryId || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding tip jar income:', error?.message);
      toast.error('Erro ao registrar entrada no Tip Jar');
      return;
    }

    const newEntry: TipJarEntry = {
      id: data.id,
      userId: data.user_id,
      amount: Number(data.amount),
      description: data.description || undefined,
      sourceEntryId: data.source_entry_id || undefined,
      createdAt: new Date(data.created_at),
    };

    setEntries(prev => [newEntry, ...prev]);
  }, [user]);

  const addExpense = useCallback(async (amount: number, description: string) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('tip_jar_entries')
      .insert({
        user_id: user.id,
        amount: -Math.abs(amount),
        description,
        source_entry_id: null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding tip jar expense:', error?.message);
      toast.error('Erro ao registrar despesa no Tip Jar');
      return;
    }

    const newEntry: TipJarEntry = {
      id: data.id,
      userId: data.user_id,
      amount: Number(data.amount),
      description: data.description || undefined,
      createdAt: new Date(data.created_at),
    };

    setEntries(prev => [newEntry, ...prev]);
  }, [user]);

  const deleteEntry = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('tip_jar_entries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting tip jar entry:', error?.message);
      toast.error('Erro ao remover entrada do Tip Jar');
      return;
    }

    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  const balance = entries.reduce((sum, e) => sum + e.amount, 0);

  return { entries, loading, balance, addIncome, addExpense, deleteEntry };
}
