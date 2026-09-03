
CREATE TABLE public.tip_jar_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  description text,
  source_entry_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tip_jar_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tip jar entries"
  ON public.tip_jar_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tip jar entries"
  ON public.tip_jar_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tip jar entries"
  ON public.tip_jar_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tip jar entries"
  ON public.tip_jar_entries FOR DELETE
  USING (auth.uid() = user_id);
