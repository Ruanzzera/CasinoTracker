
CREATE TABLE public.roulette_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  initial_bankroll numeric NOT NULL DEFAULT 0,
  current_bankroll numeric NOT NULL DEFAULT 0,
  bet_value numeric NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.roulette_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rp_select" ON public.roulette_projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "rp_insert" ON public.roulette_projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rp_update" ON public.roulette_projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "rp_delete" ON public.roulette_projects FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_rp_updated BEFORE UPDATE ON public.roulette_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.roulette_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid NOT NULL,
  match_date date NOT NULL DEFAULT CURRENT_DATE,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  score text NOT NULL DEFAULT '',
  profit numeric NOT NULL DEFAULT 0,
  bet_value numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.roulette_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rm_select" ON public.roulette_matches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "rm_insert" ON public.roulette_matches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rm_update" ON public.roulette_matches FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "rm_delete" ON public.roulette_matches FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_rm_updated BEFORE UPDATE ON public.roulette_matches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_rm_user_date ON public.roulette_matches(user_id, match_date DESC);

CREATE TABLE public.roulette_spins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  match_id uuid NOT NULL,
  project_id uuid NOT NULL,
  round_index integer NOT NULL,
  result text NOT NULL,
  bet_value numeric NOT NULL DEFAULT 0,
  profit numeric NOT NULL DEFAULT 0,
  played_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.roulette_spins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rs_select" ON public.roulette_spins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "rs_insert" ON public.roulette_spins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rs_update" ON public.roulette_spins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "rs_delete" ON public.roulette_spins FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_rs_match ON public.roulette_spins(match_id);
