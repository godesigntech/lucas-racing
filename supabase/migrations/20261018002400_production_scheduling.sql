-- Phase 8: the 16-step helmet journey, part 3 of 4 — production scheduling and rush orders.
--
-- The customer picks when their helmet goes into the workshop, not when they order. The
-- workshop controls how many helmets can start in any week, so a popular week cannot be
-- oversold. Everything here works in whole weeks starting Monday, Europe/London.
--
-- Rush orders: the fees below are the client's provisional suggestion and have NOT been
-- approved. Every tier therefore ships inactive, and production_settings.rush_enabled is
-- false, so customers only ever see standard 6-week production until the client signs the
-- prices off in the admin panel. place_order() refuses any tier that is not active.

create table public.production_settings (
  id smallint primary key default 1 check (id = 1),
  -- Standard turnaround, in whole weeks from the chosen start date.
  standard_lead_weeks integer not null default 6 check (standard_lead_weeks between 1 and 52),
  -- Helmets that can start in one week, unless production_capacity overrides it.
  weekly_capacity integer not null default 4 check (weekly_capacity >= 0),
  -- The soonest a customer may book, counted in days from today.
  booking_lead_days integer not null default 7 check (booking_lead_days >= 0),
  -- How far ahead the calendar offers dates.
  horizon_weeks integer not null default 26 check (horizon_weeks between 1 and 104),
  -- Master switch for rush orders. Stays off until the client approves the fees.
  rush_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create trigger production_settings_updated_at
  before update on public.production_settings
  for each row execute function public.set_updated_at();

insert into public.production_settings (id) values (1) on conflict (id) do nothing;

-- Turnaround options. 'standard' always exists and is always active; the rest are the
-- client's draft rush pricing.
create table public.production_rush_tiers (
  key text primary key check (key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  label text not null,
  lead_weeks integer not null check (lead_weeks between 1 and 52),
  -- Null means the fee is still to be confirmed. place_order() will not sell it.
  fee numeric(10, 2) check (fee >= 0),
  -- How many helmets on this tier may start in one week.
  max_per_week integer not null default 1 check (max_per_week >= 0),
  -- Provisional pricing the client has not approved yet.
  is_draft boolean not null default true,
  is_active boolean not null default false,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create trigger production_rush_tiers_updated_at
  before update on public.production_rush_tiers
  for each row execute function public.set_updated_at();

insert into public.production_rush_tiers (key, label, lead_weeks, fee, max_per_week, is_draft, is_active, sort_order) values
  ('standard', 'Standard', 6, 0, 1000, false, true, 1),
  ('rush-3-week', 'Rush — 3 weeks', 3, 100, 2, true, false, 2),
  ('rush-2-week', 'Rush — 2 weeks', 2, 150, 1, true, false, 3),
  ('priority-1-week', 'Priority — 1 week', 1, 200, 1, true, false, 4)
on conflict (key) do nothing;

comment on table public.production_rush_tiers is
  'Rush fees are the client''s provisional figures. Tiers stay inactive until approved; place_order() only sells active tiers with a non-null fee, and only while production_settings.rush_enabled is on.';

-- Per-week override of production_settings.weekly_capacity. week_start is a Monday.
create table public.production_capacity (
  week_start date primary key,
  slots integer not null check (slots >= 0),
  note text not null default '',
  updated_at timestamptz not null default now()
);

create trigger production_capacity_updated_at
  before update on public.production_capacity
  for each row execute function public.set_updated_at();

-- Dates the workshop is closed. Inclusive at both ends.
create table public.production_blackouts (
  id uuid primary key default gen_random_uuid(),
  starts_on date not null,
  ends_on date not null,
  reason text not null default '',
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create index production_blackouts_range_idx on public.production_blackouts (starts_on, ends_on);

-- One booked production run. Written only by place_order() / book_production_slot().
create table public.production_bookings (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  start_date date not null,
  -- Monday of the week this booking consumes a slot in.
  week_start date not null generated always as ((date_trunc('week', start_date::timestamp))::date) stored,
  rush_tier text not null references public.production_rush_tiers (key) on update cascade,
  lead_weeks integer not null check (lead_weeks between 1 and 52),
  completion_date date not null,
  helmet_count integer not null default 1 check (helmet_count >= 1),
  created_at timestamptz not null default now()
);

create index production_bookings_week_idx on public.production_bookings (week_start);
create index production_bookings_order_idx on public.production_bookings (order_id);

alter table public.orders
  add column production_start_date date,
  add column estimated_completion_date date,
  add column rush_tier text references public.production_rush_tiers (key) on update cascade,
  add column rush_fee numeric(10, 2) not null default 0 check (rush_fee >= 0);

-- ---------------------------------------------------------------------------
-- Reading availability
-- ---------------------------------------------------------------------------

/** Monday of the week containing a date. */
create or replace function public.production_week_start(p_date date)
returns date
language sql
immutable
as $$ select (date_trunc('week', p_date::timestamp))::date $$;

/** Slots in a week: the override if there is one, otherwise the standing capacity. */
create or replace function public.production_week_slots(p_week_start date)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select c.slots from public.production_capacity c where c.week_start = p_week_start),
    (select s.weekly_capacity from public.production_settings s where s.id = 1),
    0
  )
$$;

/**
 * The calendar behind step 15. One row per bookable week, with how much is left.
 * Weeks that are fully booked, blacked out or outside the booking window are still
 * returned, with available = 0, so the UI can grey them out rather than hide them.
 */
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
  weeks as (
    select public.production_week_start((current_date + g.n)::date) as week_start
    from settings s,
      generate_series(
        s.booking_lead_days,
        s.booking_lead_days + (coalesce(p_weeks, s.horizon_weeks) * 7),
        7
      ) as g(n)
  ),
  distinct_weeks as (
    select distinct week_start from weeks
  )
  select
    w.week_start,
    public.production_week_slots(w.week_start) as slots,
    coalesce((
      select sum(b.helmet_count)::integer
      from public.production_bookings b
      where b.week_start = w.week_start
    ), 0) as booked,
    greatest(
      public.production_week_slots(w.week_start) - coalesce((
        select sum(b.helmet_count)::integer
        from public.production_bookings b
        where b.week_start = w.week_start
      ), 0),
      0
    ) as available,
    exists (
      select 1 from public.production_blackouts x
      where x.starts_on <= (w.week_start + 4) and x.ends_on >= w.week_start
    ) as is_blacked_out,
    (
      w.week_start >= public.production_week_start((current_date + (select booking_lead_days from settings))::date)
      and not exists (
        select 1 from public.production_blackouts x
        where x.starts_on <= (w.week_start + 4) and x.ends_on >= w.week_start
      )
      and public.production_week_slots(w.week_start) - coalesce((
        select sum(b.helmet_count)::integer
        from public.production_bookings b
        where b.week_start = w.week_start
      ), 0) > 0
    ) as is_bookable
  from distinct_weeks w
  order by w.week_start
$$;

revoke all on function public.production_availability(integer) from public;
grant execute on function public.production_availability(integer) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Booking
-- ---------------------------------------------------------------------------

/**
 * Takes a production slot for an order, or raises.
 *
 * Concurrency: an advisory lock on the week is taken for the rest of the transaction
 * before the slot is counted, so two checkouts racing for the last slot in a week are
 * serialised and the loser is told the week filled up. Nothing else writes this table —
 * there is no insert policy, and both callers are security definer.
 *
 * Returns the completion date.
 */
create or replace function public.book_production_slot(
  p_order_id uuid,
  p_start_date date,
  p_rush_tier text,
  p_helmet_count integer default 1
)
returns date
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_settings public.production_settings;
  v_tier public.production_rush_tiers;
  v_week date;
  v_booked integer;
  v_slots integer;
  v_tier_booked integer;
  v_completion date;
begin
  select * into v_settings from public.production_settings where id = 1;
  if not found then
    raise exception 'Production scheduling is not set up yet.' using errcode = '22023';
  end if;

  select * into v_tier from public.production_rush_tiers where key = coalesce(p_rush_tier, 'standard');
  if not found or not v_tier.is_active then
    raise exception 'That turnaround is not available.' using errcode = '22023';
  end if;
  if v_tier.key <> 'standard' and not v_settings.rush_enabled then
    raise exception 'Rush orders are not available at the moment.' using errcode = '22023';
  end if;
  if v_tier.fee is null then
    raise exception '% is priced on request. Please contact us to book it.', v_tier.label using errcode = '22023';
  end if;

  if p_start_date is null then
    raise exception 'Please choose when you would like production to start.' using errcode = '22023';
  end if;
  if p_start_date < (current_date + v_settings.booking_lead_days) then
    raise exception 'The earliest production can start is %.', to_char(current_date + v_settings.booking_lead_days, 'DD Mon YYYY') using errcode = '22023';
  end if;
  if p_start_date > (current_date + (v_settings.horizon_weeks * 7)) then
    raise exception 'We are not taking production bookings that far ahead yet.' using errcode = '22023';
  end if;

  v_week := public.production_week_start(p_start_date);

  if exists (
    select 1 from public.production_blackouts x
    where x.starts_on <= p_start_date and x.ends_on >= p_start_date
  ) then
    raise exception 'The workshop is closed that week. Please choose another start date.' using errcode = '22023';
  end if;

  -- Serialise everyone booking into this week.
  perform pg_advisory_xact_lock(hashtext('lucas-production-week'), hashtext(v_week::text));

  v_slots := public.production_week_slots(v_week);
  select coalesce(sum(b.helmet_count), 0) into v_booked
  from public.production_bookings b where b.week_start = v_week;

  if v_booked + p_helmet_count > v_slots then
    raise exception 'That week is now full. Please choose another production start date.' using errcode = '22023';
  end if;

  if v_tier.key <> 'standard' then
    select coalesce(sum(b.helmet_count), 0) into v_tier_booked
    from public.production_bookings b
    where b.week_start = v_week and b.rush_tier = v_tier.key;
    if v_tier_booked + p_helmet_count > v_tier.max_per_week then
      raise exception 'We are already full for % that week.', v_tier.label using errcode = '22023';
    end if;
  end if;

  v_completion := p_start_date + (v_tier.lead_weeks * 7);

  insert into public.production_bookings (order_id, start_date, rush_tier, lead_weeks, completion_date, helmet_count)
  values (p_order_id, p_start_date, v_tier.key, v_tier.lead_weeks, v_completion, p_helmet_count);

  return v_completion;
end;
$$;

revoke all on function public.book_production_slot(uuid, date, text, integer) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.production_settings enable row level security;
alter table public.production_rush_tiers enable row level security;
alter table public.production_capacity enable row level security;
alter table public.production_blackouts enable row level security;
alter table public.production_bookings enable row level security;

-- Customers need the standard lead time and the rush tiers that are actually on sale,
-- so the builder can show a completion date before they order.
create policy "Anyone can read production settings" on public.production_settings
  for select to anon, authenticated using (true);
create policy "Admins manage production settings" on public.production_settings
  for all to authenticated using ((select public.is_full_admin())) with check ((select public.is_full_admin()));

create policy "Anyone can read live tiers" on public.production_rush_tiers
  for select to anon, authenticated using (is_active or (select public.is_admin()));
create policy "Admins manage tiers" on public.production_rush_tiers
  for all to authenticated using ((select public.is_full_admin())) with check ((select public.is_full_admin()));

-- Capacity and blackouts are workshop business; availability is published through
-- public.production_availability() instead, which only exposes how much is left.
create policy "Staff read capacity" on public.production_capacity
  for select to authenticated using ((select public.is_admin()));
create policy "Admins manage capacity" on public.production_capacity
  for all to authenticated using ((select public.is_full_admin())) with check ((select public.is_full_admin()));

create policy "Staff read blackouts" on public.production_blackouts
  for select to authenticated using ((select public.is_admin()));
create policy "Admins manage blackouts" on public.production_blackouts
  for all to authenticated using ((select public.is_full_admin())) with check ((select public.is_full_admin()));

-- No insert policy: bookings are only ever made by book_production_slot().
create policy "Customers read own bookings" on public.production_bookings
  for select to authenticated
  using (
    (select public.is_admin())
    or exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid()))
  );
create policy "Admins manage bookings" on public.production_bookings
  for all to authenticated using ((select public.is_full_admin())) with check ((select public.is_full_admin()));
