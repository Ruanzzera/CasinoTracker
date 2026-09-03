ALTER TABLE public.bet_and_win_entries ADD COLUMN spin_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.bet_and_win_entries ADD COLUMN spin_bet numeric NOT NULL DEFAULT 0;