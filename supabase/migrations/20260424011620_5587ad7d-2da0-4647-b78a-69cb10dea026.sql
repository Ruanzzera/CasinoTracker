ALTER TABLE public.tournaments
  ADD COLUMN manual_invested numeric,
  ADD COLUMN prize_position_cutoff integer NOT NULL DEFAULT 0;