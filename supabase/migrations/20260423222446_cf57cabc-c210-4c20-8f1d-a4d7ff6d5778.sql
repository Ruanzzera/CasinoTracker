ALTER TABLE public.tournaments
  ADD COLUMN prize_type text NOT NULL DEFAULT 'giros',
  ADD COLUMN prize_cash_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN initial_position integer NOT NULL DEFAULT 0,
  ADD COLUMN initial_points numeric NOT NULL DEFAULT 0;

ALTER TABLE public.tournament_sessions
  ADD COLUMN rollover_game text NOT NULL DEFAULT '';