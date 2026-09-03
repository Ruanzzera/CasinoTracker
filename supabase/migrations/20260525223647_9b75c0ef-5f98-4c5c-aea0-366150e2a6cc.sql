
CREATE TABLE public.roulette_modes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  payout_multiplier numeric NOT NULL DEFAULT 2,
  default_bet numeric NOT NULL DEFAULT 10,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.roulette_modes ENABLE ROW LEVEL SECURITY;

CREATE POLICY rmode_select ON public.roulette_modes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY rmode_insert ON public.roulette_modes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY rmode_update ON public.roulette_modes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY rmode_delete ON public.roulette_modes FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_roulette_modes_updated
BEFORE UPDATE ON public.roulette_modes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.roulette_matches
  ADD COLUMN mode_id uuid,
  ADD COLUMN mode_name text NOT NULL DEFAULT 'Roleta',
  ADD COLUMN payout_multiplier numeric NOT NULL DEFAULT 3;

ALTER TABLE public.roulette_spins
  ADD COLUMN is_gale boolean NOT NULL DEFAULT false,
  ADD COLUMN gale_stake numeric;
