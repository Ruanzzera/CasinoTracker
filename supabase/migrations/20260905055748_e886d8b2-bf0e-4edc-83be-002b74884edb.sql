CREATE OR REPLACE FUNCTION public.dashboard_summary()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH src AS (
    SELECT amount, type, house, game,
           (created_at AT TIME ZONE 'America/Sao_Paulo') AS local_ts
    FROM public.casino_entries
    WHERE type <> 'torneio'
  ), bounds AS (
    SELECT (now() AT TIME ZONE 'America/Sao_Paulo') AS local_now
  ), agg AS (
    SELECT
      COALESCE(SUM(amount), 0) AS total_profit,
      COALESCE(SUM(amount) FILTER (WHERE local_ts >= date_trunc('day', (SELECT local_now FROM bounds))), 0) AS daily_total,
      COALESCE(SUM(amount) FILTER (WHERE local_ts >= date_trunc('month', (SELECT local_now FROM bounds))), 0) AS monthly_total,
      COALESCE(SUM(amount) FILTER (WHERE local_ts >= date_trunc('year', (SELECT local_now FROM bounds))), 0) AS yearly_total,
      COUNT(*) AS entries_count
    FROM src
  ), best_type AS (
    SELECT type, SUM(amount) AS total FROM src GROUP BY type ORDER BY SUM(amount) DESC LIMIT 1
  ), best_house AS (
    SELECT house, SUM(amount) AS total FROM src GROUP BY house ORDER BY SUM(amount) DESC LIMIT 1
  ), best_game AS (
    SELECT game, SUM(amount) AS total FROM src GROUP BY game ORDER BY SUM(amount) DESC LIMIT 1
  ), best_hour AS (
    SELECT EXTRACT(HOUR FROM local_ts)::int AS hour, SUM(amount) AS total
    FROM src GROUP BY 1 ORDER BY SUM(amount) DESC LIMIT 1
  )
  SELECT jsonb_build_object(
    'totalProfit', a.total_profit,
    'dailyTotal', a.daily_total,
    'monthlyTotal', a.monthly_total,
    'yearlyTotal', a.yearly_total,
    'entriesCount', a.entries_count,
    'bestType', (SELECT jsonb_build_object('type', type, 'total', total) FROM best_type),
    'bestHouse', (SELECT jsonb_build_object('house', house, 'total', total) FROM best_house),
    'bestGame', (SELECT jsonb_build_object('game', game, 'total', total) FROM best_game),
    'bestHour', (SELECT jsonb_build_object('hour', hour, 'total', total) FROM best_hour)
  )
  FROM agg a;
$$;

GRANT EXECUTE ON FUNCTION public.dashboard_summary() TO authenticated;

CREATE OR REPLACE FUNCTION public.library_names()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH names AS (
    SELECT house, game FROM public.casino_entries
    UNION ALL
    SELECT house, game FROM public.bet_and_win_entries
    UNION ALL
    SELECT NULL::text, prize_game FROM public.bet_and_win_entries
    UNION ALL
    SELECT house, rollover_game FROM public.tournaments
    UNION ALL
    SELECT NULL::text, rollover_game FROM public.tournament_sessions
  )
  SELECT jsonb_build_object(
    'houses', COALESCE((SELECT jsonb_agg(DISTINCT house) FROM names WHERE house IS NOT NULL AND house <> ''), '[]'::jsonb),
    'games', COALESCE((SELECT jsonb_agg(DISTINCT game) FROM names WHERE game IS NOT NULL AND game <> ''), '[]'::jsonb)
  );
$$;

GRANT EXECUTE ON FUNCTION public.library_names() TO authenticated;