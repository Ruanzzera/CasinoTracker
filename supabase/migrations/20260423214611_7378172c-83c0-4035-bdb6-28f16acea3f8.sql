-- Tabela de torneios (cabeçalho)
CREATE TABLE public.tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  house TEXT NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL DEFAULT CURRENT_DATE,
  rollover_game TEXT NOT NULL DEFAULT '',
  points_per_real NUMERIC NOT NULL DEFAULT 1,
  prize_spins_count INTEGER NOT NULL DEFAULT 0,
  prize_spins_value NUMERIC NOT NULL DEFAULT 0,
  current_position INTEGER NOT NULL DEFAULT 0,
  points_player_above NUMERIC NOT NULL DEFAULT 0,
  points_player_below NUMERIC NOT NULL DEFAULT 0,
  target_points NUMERIC NOT NULL DEFAULT 0,
  finalized_month TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tournaments"
ON public.tournaments FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tournaments"
ON public.tournaments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tournaments"
ON public.tournaments FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tournaments"
ON public.tournaments FOR DELETE USING (auth.uid() = user_id);

-- Tabela de sessões de torneio
CREATE TABLE public.tournament_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  spins_count NUMERIC NOT NULL DEFAULT 0,
  bet_value NUMERIC NOT NULL DEFAULT 0,
  initial_bankroll NUMERIC NOT NULL DEFAULT 0,
  final_bankroll NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tournament_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tournament sessions"
ON public.tournament_sessions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tournament sessions"
ON public.tournament_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tournament sessions"
ON public.tournament_sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tournament sessions"
ON public.tournament_sessions FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_tournament_sessions_tournament_id ON public.tournament_sessions(tournament_id);
CREATE INDEX idx_tournaments_user_id ON public.tournaments(user_id);

-- Trigger de updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_tournaments_updated_at
BEFORE UPDATE ON public.tournaments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tournament_sessions_updated_at
BEFORE UPDATE ON public.tournament_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();