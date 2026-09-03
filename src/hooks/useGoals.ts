import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CasinoGoal } from '@/types/casino';
import { useAuth } from '@/hooks/useAuth';

export function useGoals() {
  const [goals, setGoals] = useState<CasinoGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchGoals = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('casino_goals')
      .select('*');

    if (error) {
      console.error('Error fetching goals:', error?.message);
      setLoading(false);
      return;
    }

    const formattedGoals: CasinoGoal[] = (data || []).map(g => ({
      id: g.id,
      type: g.type as 'daily' | 'monthly',
      targetAmount: Number(g.target_amount),
    }));

    setGoals(formattedGoals);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const setGoal = useCallback(async (type: 'daily' | 'monthly', targetAmount: number) => {
    if (!user) return;

    const existingGoal = goals.find(g => g.type === type);

    if (existingGoal) {
      const { error } = await supabase
        .from('casino_goals')
        .update({ target_amount: targetAmount })
        .eq('id', existingGoal.id);

      if (!error) {
        setGoals(prev => prev.map(g => 
          g.type === type ? { ...g, targetAmount } : g
        ));
      }
    } else {
      const { data, error } = await supabase
        .from('casino_goals')
        .insert({
          user_id: user.id,
          type,
          target_amount: targetAmount,
        })
        .select()
        .single();

      if (!error && data) {
        setGoals(prev => [...prev, {
          id: data.id,
          type: data.type as 'daily' | 'monthly',
          targetAmount: Number(data.target_amount),
        }]);
      }
    }
  }, [goals, user]);

  const getGoal = useCallback((type: 'daily' | 'monthly') => {
    return goals.find(g => g.type === type);
  }, [goals]);

  return { goals, loading, setGoal, getGoal };
}
