-- The workshop is fully booked for the rest of 2026 (client, 18 Nov 2026): no helmet can
-- start before January 2027. A closed period, like holidays, so the first week customers
-- can pick is Monday 4 January 2027. Admin > Production lists it and can remove it.
insert into public.production_blackouts (starts_on, ends_on, reason)
select date '2026-11-16', date '2026-12-31', 'Fully booked for 2026'
where not exists (
  select 1 from public.production_blackouts where starts_on = date '2026-11-16' and ends_on = date '2026-12-31'
);
