ALTER TABLE public.bet_and_win_entries ADD COLUMN prize_game text NOT NULL DEFAULT '';
ALTER TABLE public.bet_and_win_entries ADD COLUMN bet_value numeric NOT NULL DEFAULT 0;