-- Adiciona coluna de contas às entradas de Aposte e Ganhe
alter table public.bet_and_win_entries
  add column if not exists account text[] not null default '{Ruan}';

-- Atualiza função de criação atômica
CREATE OR REPLACE FUNCTION public.bet_and_win_create(
  p_entry_date date, p_entry_time text, p_house text,
  p_rollover_game text, p_prize_game text,
  p_bet_value numeric, p_required_bets numeric,
  p_initial_bankroll numeric, p_final_bankroll numeric,
  p_spin_count int, p_spin_bet numeric, p_spin_prize numeric,
  p_created_at timestamptz, p_account text[] DEFAULT '{Ruan}'
) RETURNS public.bet_and_win_entries
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare
  v_user uuid := auth.uid();
  v_balance numeric := (p_final_bankroll - p_initial_bankroll) + p_spin_prize;
  v_casino_id uuid := null;
  v_dash_game text := coalesce(nullif(p_prize_game,''), nullif(p_rollover_game,''), 'Aposte e Ganhe');
  v_dash_account text := coalesce(p_account[1], 'Ruan');
  v_row public.bet_and_win_entries;
begin
  if v_user is null then raise exception 'not authenticated'; end if;

  if v_balance <> 0 then
    insert into public.casino_entries(user_id, amount, type, house, game, notes, created_at, account)
    values (v_user, v_balance, 'aposte_ganhe', p_house, v_dash_game,
            'Aposte e Ganhe — ' || p_house, p_created_at, v_dash_account)
    returning id into v_casino_id;
  end if;

  insert into public.bet_and_win_entries(
    user_id, entry_date, entry_time, house, game, prize_game,
    bet_value, required_bets, initial_bankroll, final_bankroll,
    spin_count, spin_bet, spin_prize, casino_entry_id, account
  ) values (
    v_user, p_entry_date, p_entry_time, p_house, p_rollover_game, p_prize_game,
    p_bet_value, p_required_bets, p_initial_bankroll, p_final_bankroll,
    p_spin_count, p_spin_bet, p_spin_prize, v_casino_id, coalesce(p_account, '{Ruan}')
  ) returning * into v_row;

  return v_row;
end $$;

GRANT EXECUTE ON FUNCTION public.bet_and_win_create(date,text,text,text,text,numeric,numeric,numeric,numeric,int,numeric,numeric,timestamptz,text[]) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.bet_and_win_create(date,text,text,text,text,numeric,numeric,numeric,numeric,int,numeric,numeric,timestamptz,text[]) FROM public, anon;

-- Atualiza função de atualização atômica
CREATE OR REPLACE FUNCTION public.bet_and_win_update(
  p_id uuid,
  p_entry_date date, p_entry_time text, p_house text,
  p_rollover_game text, p_prize_game text,
  p_bet_value numeric, p_required_bets numeric,
  p_initial_bankroll numeric, p_final_bankroll numeric,
  p_spin_count int, p_spin_bet numeric, p_spin_prize numeric,
  p_created_at timestamptz, p_account text[] DEFAULT '{Ruan}'
) RETURNS public.bet_and_win_entries
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare
  v_user uuid := auth.uid();
  v_balance numeric := (p_final_bankroll - p_initial_bankroll) + p_spin_prize;
  v_dash_game text := coalesce(nullif(p_prize_game,''), nullif(p_rollover_game,''), 'Aposte e Ganhe');
  v_dash_account text := coalesce(p_account[1], 'Ruan');
  v_existing_casino uuid;
  v_new_casino uuid;
  v_orphan uuid;
  v_row public.bet_and_win_entries;
begin
  if v_user is null then raise exception 'not authenticated'; end if;

  select casino_entry_id into v_existing_casino
  from public.bet_and_win_entries where id = p_id and user_id = v_user;

  v_new_casino := v_existing_casino;

  if v_existing_casino is not null then
    if v_balance = 0 then
      delete from public.casino_entries where id = v_existing_casino and user_id = v_user;
      v_new_casino := null;
    else
      update public.casino_entries set
        amount = v_balance, house = p_house, game = v_dash_game,
        notes = 'Aposte e Ganhe — ' || p_house, created_at = p_created_at,
        account = v_dash_account
      where id = v_existing_casino and user_id = v_user;
    end if;
  elsif v_balance <> 0 then
    select id into v_orphan from public.casino_entries
      where user_id = v_user
        and type = 'aposte_ganhe'
        and house = p_house
        and created_at >= (p_entry_date::timestamp at time zone 'America/Sao_Paulo')
        and created_at < ((p_entry_date + 1)::timestamp at time zone 'America/Sao_Paulo')
      limit 1;
    if v_orphan is not null then
      update public.casino_entries set
        amount = v_balance, house = p_house, game = v_dash_game,
        notes = 'Aposte e Ganhe — ' || p_house, created_at = p_created_at,
        account = v_dash_account
      where id = v_orphan;
      v_new_casino := v_orphan;
    else
      insert into public.casino_entries(user_id, amount, type, house, game, notes, created_at, account)
      values (v_user, v_balance, 'aposte_ganhe', p_house, v_dash_game,
              'Aposte e Ganhe — ' || p_house, p_created_at, v_dash_account)
      returning id into v_new_casino;
    end if;
  end if;

  update public.bet_and_win_entries set
    entry_date = p_entry_date, entry_time = p_entry_time, house = p_house,
    game = p_rollover_game, prize_game = p_prize_game,
    bet_value = p_bet_value, required_bets = p_required_bets,
    initial_bankroll = p_initial_bankroll, final_bankroll = p_final_bankroll,
    spin_count = p_spin_count, spin_bet = p_spin_bet, spin_prize = p_spin_prize,
    casino_entry_id = v_new_casino,
    account = coalesce(p_account, '{Ruan}')
  where id = p_id and user_id = v_user
  returning * into v_row;

  return v_row;
end $$;

GRANT EXECUTE ON FUNCTION public.bet_and_win_update(uuid,date,text,text,text,text,numeric,numeric,numeric,numeric,int,numeric,numeric,timestamptz,text[]) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.bet_and_win_update(uuid,date,text,text,text,text,numeric,numeric,numeric,numeric,int,numeric,numeric,timestamptz,text[]) FROM public, anon;

-- Revoga acesso às assinaturas antigas para evitar chamadas sem account
REVOKE EXECUTE ON FUNCTION public.bet_and_win_create(date,text,text,text,text,numeric,numeric,numeric,numeric,int,numeric,numeric,timestamptz) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bet_and_win_update(uuid,date,text,text,text,text,numeric,numeric,numeric,numeric,int,numeric,numeric,timestamptz) FROM public, anon, authenticated;

-- Revoga permissões antigas restantes
REVOKE EXECUTE ON FUNCTION public.bet_and_win_delete(uuid) FROM public, anon;