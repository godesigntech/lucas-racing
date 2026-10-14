-- Lucas Racing: roles, profile sync and row level security.

-- True when the signed-in user's email is on the admin allowlist.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users a
    where a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Create a profile for every new auth user, and keep its email in sync.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, lower(new.email), coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = lower(new.email) where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.site_settings enable row level security;
alter table public.helmet_models enable row level security;
alter table public.products enable row level security;
alter table public.films enable row level security;
alter table public.configurator_options enable row level security;
alter table public.profiles enable row level security;
alter table public.admin_users enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_events enable row level security;

-- Settings: public read, admin update.
create policy "Anyone can read site settings" on public.site_settings
  for select to anon, authenticated using (true);
create policy "Admins update site settings" on public.site_settings
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Catalogue tables: public reads active rows, admins manage everything.
create policy "Anyone can read active helmet models" on public.helmet_models
  for select to anon, authenticated using (is_active or (select public.is_admin()));
create policy "Admins manage helmet models" on public.helmet_models
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Anyone can read active products" on public.products
  for select to anon, authenticated using (is_active or (select public.is_admin()));
create policy "Admins manage products" on public.products
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Anyone can read active films" on public.films
  for select to anon, authenticated using (is_active or (select public.is_admin()));
create policy "Admins manage films" on public.films
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Anyone can read active options" on public.configurator_options
  for select to anon, authenticated using (is_active or (select public.is_admin()));
create policy "Admins manage options" on public.configurator_options
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Profiles: owners read and update their own, admins read all.
create policy "Users read own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or (select public.is_admin()));
create policy "Users update own profile" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Admin allowlist: admins only.
create policy "Admins read admin list" on public.admin_users
  for select to authenticated using ((select public.is_admin()));
create policy "Admins add admins" on public.admin_users
  for insert to authenticated with check ((select public.is_admin()));
create policy "Admins remove admins" on public.admin_users
  for delete to authenticated using ((select public.is_admin()));

-- Orders: customers read their own; admins read and update all.
-- Inserts only happen through public.place_order().
create policy "Customers read own orders" on public.orders
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Admins update orders" on public.orders
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Customers read own order items" on public.order_items
  for select to authenticated using (
    (select public.is_admin())
    or exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid()))
  );

create policy "Customers read own order history" on public.order_status_events
  for select to authenticated using (
    (select public.is_admin())
    or exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid()))
  );
create policy "Admins add order history" on public.order_status_events
  for insert to authenticated with check ((select public.is_admin()));

-- Customer list for the admin panel. security_invoker keeps RLS in force,
-- so only admins see every row.
create view public.customer_summaries
with (security_invoker = true) as
select
  p.id,
  p.email,
  p.full_name,
  p.phone,
  p.city,
  p.postcode,
  p.created_at,
  count(o.id)::integer as order_count,
  coalesce(sum(o.total) filter (where o.status <> 'cancelled'), 0)::numeric(10, 2) as total_spent,
  max(o.created_at) as last_order_at
from public.profiles p
left join public.orders o on o.user_id = p.id
group by p.id;
