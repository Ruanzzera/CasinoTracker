
CREATE TABLE public.tournament_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  house TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  schedule_type TEXT NOT NULL DEFAULT 'specific',
  specific_date TIMESTAMPTZ,
  day_of_week INTEGER,
  time_of_day TIME,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tournament_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tournament schedules"
ON public.tournament_schedule FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tournament schedules"
ON public.tournament_schedule FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tournament schedules"
ON public.tournament_schedule FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tournament schedules"
ON public.tournament_schedule FOR DELETE
USING (auth.uid() = user_id);
