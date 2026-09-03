ALTER TABLE public.bet_and_win_entries
  ADD COLUMN IF NOT EXISTS entry_time TEXT NOT NULL DEFAULT '12:00',
  ADD COLUMN IF NOT EXISTS casino_entry_id UUID;

CREATE INDEX IF NOT EXISTS idx_bet_and_win_casino_entry ON public.bet_and_win_entries(casino_entry_id);