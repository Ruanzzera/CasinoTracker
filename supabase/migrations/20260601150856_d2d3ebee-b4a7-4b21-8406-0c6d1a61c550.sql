ALTER TABLE public.roulette_modes 
  ADD COLUMN IF NOT EXISTS match_rounds integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS max_gales integer NOT NULL DEFAULT 2;

ALTER TABLE public.roulette_spins
  ADD COLUMN IF NOT EXISTS gale_count integer NOT NULL DEFAULT 0;

-- Update existing default modes to match new spec
UPDATE public.roulette_modes SET match_rounds = 2, max_gales = 2 WHERE lower(name) = 'roleta';
UPDATE public.roulette_modes SET match_rounds = 3, max_gales = 2 WHERE lower(name) = 'bacbo';