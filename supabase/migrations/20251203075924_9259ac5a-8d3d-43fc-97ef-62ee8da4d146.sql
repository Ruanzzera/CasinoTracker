-- Create table for casino entries
CREATE TABLE public.casino_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bonus', 'freespins', 'daily', 'bet', 'mission')),
  house TEXT NOT NULL,
  game TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.casino_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own entries
CREATE POLICY "Users can view their own entries"
ON public.casino_entries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own entries"
ON public.casino_entries FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entries"
ON public.casino_entries FOR DELETE
USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_casino_entries_user_id ON public.casino_entries(user_id);
CREATE INDEX idx_casino_entries_created_at ON public.casino_entries(created_at DESC);