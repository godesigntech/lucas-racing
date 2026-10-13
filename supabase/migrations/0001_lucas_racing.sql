-- Lucas Racing demo: document store + permissions.
-- Run once in the Supabase SQL editor (or via the Supabase CLI/MCP).
-- Afterwards the app switches from browser-local storage to this database automatically.

create table if not exists public.lr_records (
  id          text primary key,
  collection  text not null check (collection in
               ('helmetDesigns','kartDesigns','jobs','kartOrders','partOrders','enquiries','shares','notifications','settings')),
  owner_id    uuid references auth.users(id) on delete set null,
  is_public   boolean not null default false,
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists lr_records_collection_idx on public.lr_records (collection, updated_at desc);
create index if not exists lr_records_owner_idx on public.lr_records (owner_id);

-- Workshop staff are identified by email. Add more rows to grant admin access.
create table if not exists public.lr_admins (email text primary key);
insert into public.lr_admins (email) values ('godesign.pk@gmail.com') on conflict do nothing;

alter table public.lr_records enable row level security;
alter table public.lr_admins enable row level security;

create or replace function public.lr_is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.lr_admins a where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;

-- Reads: own rows, admin, settings (public config). Guest rows are reachable only by id via lr_get.
drop policy if exists lr_records_select on public.lr_records;
create policy lr_records_select on public.lr_records for select
  using (
    collection = 'settings'
    or (auth.uid() is not null and owner_id = auth.uid())
    or public.lr_is_admin()
  );
-- All writes go through the RPCs below; no direct insert/update/delete policies.

-- Fetch one record by id (capability-style access for guest orders and share links).
create or replace function public.lr_get(p_id text)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare r public.lr_records;
begin
  select * into r from public.lr_records where id = p_id;
  if not found then return null; end if;
  if r.collection = 'settings' or r.is_public or r.owner_id is null
     or r.owner_id = auth.uid() or public.lr_is_admin() then
    return r.data;
  end if;
  return null;
end $$;

-- Create/update with ownership rules.
create or replace function public.lr_put(p_id text, p_collection text, p_data jsonb, p_public boolean default false)
returns void language plpgsql security definer set search_path = ''
as $$
declare r public.lr_records; v_admin boolean := public.lr_is_admin();
begin
  if p_collection = 'settings' and not v_admin then
    raise exception 'Only workshop staff can change settings';
  end if;
  if p_collection in ('helmetDesigns','kartDesigns') and auth.uid() is null then
    raise exception 'Sign in to save designs';
  end if;
  select * into r from public.lr_records where id = p_id;
  if not found then
    if auth.uid() is null and p_collection not in ('jobs','kartOrders','partOrders','enquiries','notifications','shares') then
      raise exception 'Sign in required';
    end if;
    insert into public.lr_records (id, collection, owner_id, is_public, data)
    values (p_id, p_collection, auth.uid(), coalesce(p_public, false), p_data);
  else
    if r.collection <> p_collection then raise exception 'Collection mismatch'; end if;
    if not (v_admin or r.owner_id = auth.uid() or (r.owner_id is null and r.collection in ('jobs','kartOrders','partOrders','shares'))) then
      raise exception 'Not allowed';
    end if;
    update public.lr_records
       set data = p_data, is_public = coalesce(p_public, r.is_public), updated_at = now()
     where id = p_id;
  end if;
end $$;

-- Delete: drafts/shares only. Paid orders and production history are never deletable.
create or replace function public.lr_delete(p_id text)
returns void language plpgsql security definer set search_path = ''
as $$
declare r public.lr_records;
begin
  select * into r from public.lr_records where id = p_id;
  if not found then return; end if;
  if r.collection in ('jobs','kartOrders','partOrders') then
    raise exception 'Production history cannot be deleted';
  end if;
  if not (public.lr_is_admin() or r.owner_id = auth.uid()) then
    raise exception 'Not allowed';
  end if;
  delete from public.lr_records where id = p_id;
end $$;

revoke all on function public.lr_get(text) from public;
revoke all on function public.lr_put(text, text, jsonb, boolean) from public;
revoke all on function public.lr_delete(text) from public;
grant execute on function public.lr_is_admin() to anon, authenticated;
grant execute on function public.lr_get(text) to anon, authenticated;
grant execute on function public.lr_put(text, text, jsonb, boolean) to anon, authenticated;
grant execute on function public.lr_delete(text) to anon, authenticated;
grant select on public.lr_records to anon, authenticated;
