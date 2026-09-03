CREATE TABLE public.pending_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  house TEXT NOT NULL,
  account TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open',
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pending_balances TO authenticated;
GRANT ALL ON public.pending_balances TO service_role;
ALTER TABLE public.pending_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own pending select" ON public.pending_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own pending insert" ON public.pending_balances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own pending update" ON public.pending_balances FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own pending delete" ON public.pending_balances FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_pending_balances_updated_at BEFORE UPDATE ON public.pending_balances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_pending_balances_user_status ON public.pending_balances(user_id, status);