-- Fix: the calendar and the booking disagreed about the notice period.
--
-- production_availability() offered any week whose Monday fell in the week containing
-- "today + booking_lead_days", while book_production_slot() refuses a start date before
-- that day itself. With seven days' notice on a Wednesday, the calendar offered the week
-- starting Monday — two days too soon — and booking it failed with "the earliest
-- production can start is …". The first customer to pick the soonest week would have hit
-- it at checkout.
--
-- Both now use the same rule: the first week offered is the first Monday on or after
-- today plus the notice period.

create or replace function public.production_availability(p_weeks integer default null)
returns table (
  week_start date,
  slots integer,
  booked integer,
  available integer,
  is_blacked_out boolean,
  is_bookable boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with settings as (
    select * from public.production_settings where id = 1
  ),
  -- The first Monday that still leaves the workshop its full notice period.
  first_week as (
    select public.production_week_start((current_date + s.booking_lead_days + 6)::date) as monday,
           s.booking_lead_days,
           s.horizon_weeks
    from settings s
  ),
  weeks as (
    select (f.monday + (g.n * 7))::date as week_start
    from first_week f,
      generate_series(0, coalesce(p_weeks, f.horizon_weeks)) as g(n)
  ),
  counted as (
    select
      w.week_start,
      public.production_week_slots(w.week_start) as slots,
      coalesce((
        select sum(b.helmet_count)::integer
        from public.production_bookings b
        where b.week_start = w.week_start
      ), 0) as booked,
      exists (
        select 1 from public.production_blackouts x
        where x.starts_on <= (w.week_start + 4) and x.ends_on >= w.week_start
      ) as is_blacked_out
    from weeks w
  )
  select
    c.week_start,
    c.slots,
    c.booked,
    greatest(c.slots - c.booked, 0) as available,
    c.is_blacked_out,
    (not c.is_blacked_out and (c.slots - c.booked) > 0) as is_bookable
  from counted c
  order by c.week_start
$$;

revoke all on function public.production_availability(integer) from public;
grant execute on function public.production_availability(integer) to anon, authenticated;
