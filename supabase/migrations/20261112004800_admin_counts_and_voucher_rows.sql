-- Admin figures worked out in the database, not by downloading rows: Supabase returns at
-- most 1,000 rows per request, so totals and counts went wrong as orders grew.

create or replace function public.admin_order_stats()
returns table (
  revenue_paid numeric,
  revenue_last_30_days numeric,
  orders_last_30_days integer,
  open_orders integer,
  awaiting_payment integer,
  status_counts jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (select public.is_admin()) then
    raise exception 'You don''t have permission to do that.' using errcode = '42501';
  end if;
  return query
  select
    coalesce(sum(o.total) filter (where o.payment_status = 'paid'), 0),
    coalesce(sum(o.total) filter (where o.created_at >= now() - interval '30 days' and o.status <> 'cancelled'), 0),
    (count(*) filter (where o.created_at >= now() - interval '30 days'))::integer,
    (count(*) filter (where o.status not in ('completed', 'cancelled')))::integer,
    (count(*) filter (where o.status <> 'cancelled' and o.payment_status = 'unpaid'))::integer,
    coalesce((select jsonb_object_agg(s.status, s.n) from (select o2.status, count(*) as n from public.orders o2 group by o2.status) s), '{}'::jsonb)
  from public.orders o;
end;
$$;

revoke all on function public.admin_order_stats() from public;
grant execute on function public.admin_order_stats() to authenticated;

-- Vouchers: return what was issued (with who it's for), so the emails go to exactly
-- those entrants rather than whatever looks new by the clock.
drop function if exists public.issue_competition_vouchers(uuid);

create function public.issue_competition_vouchers(p_competition uuid)
returns table (code text, percent_off smallint, expires_at timestamptz, entrant_name text, entrant_email text, place smallint)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.is_admin()) then
    raise exception 'You don''t have permission to do that.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.competitions c where c.id = p_competition and c.status = 'judged') then
    raise exception 'Choose the winner before issuing vouchers.' using errcode = '22023';
  end if;

  return query
  with issued as (
    insert into public.vouchers (code, user_id, percent_off, description, competition_id, competition_entry_id, expires_at)
    select
      'LR-' || upper(substr(md5(gen_random_uuid()::text), 1, 8)),
      e.user_id,
      case e.place when 2 then 50 when 3 then 40 when 4 then 30 when 5 then 20 else 10 end,
      case when e.place is not null then e.place || case e.place when 2 then 'nd' when 3 then 'rd' else 'th' end || ' place, ' else '' end
        || (select c.title from public.competitions c where c.id = p_competition),
      p_competition,
      e.id,
      now() + interval '12 months'
    from public.competition_entries e
    where e.competition_id = p_competition
      and e.status not in ('disqualified', 'winner')
      and not exists (select 1 from public.vouchers v where v.competition_entry_id = e.id)
    returning vouchers.code, vouchers.percent_off, vouchers.expires_at, vouchers.competition_entry_id
  )
  select i.code, i.percent_off, i.expires_at, e.name, e.email, e.place
  from issued i
  join public.competition_entries e on e.id = i.competition_entry_id;
end;
$$;

revoke all on function public.issue_competition_vouchers(uuid) from public;
grant execute on function public.issue_competition_vouchers(uuid) to authenticated;
