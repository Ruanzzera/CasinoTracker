
-- Tournament entries table
CREATE TABLE public.tournament_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  house text NOT NULL,
  amount_spent numeric NOT NULL DEFAULT 0,
  slot text NOT NULL DEFAULT '',
  prize_description text,
  amount_won numeric NOT NULL DEFAULT 0,
  finalized_month text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tournament_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tournament entries" ON public.tournament_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tournament entries" ON public.tournament_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tournament entries" ON public.tournament_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tournament entries" ON public.tournament_entries FOR DELETE USING (auth.uid() = user_id);

-- Bet and Win entries table
CREATE TABLE public.bet_and_win_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  house text NOT NULL,
  game text NOT NULL DEFAULT '',
  required_bets numeric NOT NULL DEFAULT 0,
  initial_bankroll numeric NOT NULL DEFAULT 0,
  final_bankroll numeric NOT NULL DEFAULT 0,
  spin_prize numeric NOT NULL DEFAULT 0,
  finalized_month text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bet_and_win_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bet_and_win entries" ON public.bet_and_win_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own bet_and_win entries" ON public.bet_and_win_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bet_and_win entries" ON public.bet_and_win_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own bet_and_win entries" ON public.bet_and_win_entries FOR DELETE USING (auth.uid() = user_id);
