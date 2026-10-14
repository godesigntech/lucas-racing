-- Lucas Racing: design assistant quote requests.
-- Guests and signed-in customers upload a helmet photo, get a concept and
-- matching designs, then ask for a quote. The workshop follows up from the admin panel.

create sequence public.quote_number_seq start 1001;

create table public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default 'Q-' || nextval('public.quote_number_seq'),
  user_id uuid references public.profiles (id) on delete set null,
  name text not null,
  email text not null,
  phone text not null default '',
  helmet text not null,
  notes text not null default '',
  image_path text,
  palette text[] not null default '{}',
  concept jsonb not null default '{}',
  suggested_products text[] not null default '{}',
  status text not null default 'new' check (status in ('new', 'contacted', 'quoted', 'won', 'lost')),
  admin_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index quote_requests_created_at_idx on public.quote_requests (created_at desc);
create index quote_requests_email_created_idx on public.quote_requests (lower(email), created_at desc);

create trigger quote_requests_updated_at before update on public.quote_requests
  for each row execute function public.set_updated_at();

-- The only way to create a quote request. Validates everything, links the request
-- to the signed-in customer (if any) and limits repeat submissions.
create or replace function public.submit_quote_request(
  p_name text,
  p_email text,
  p_phone text,
  p_helmet text,
  p_notes text,
  p_image_path text,
  p_palette text[],
  p_concept jsonb,
  p_suggested_products text[]
)
returns table (reference text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_name text := btrim(coalesce(p_name, ''));
  v_recent integer;
begin
  if char_length(v_name) not between 2 and 80 then
    raise exception 'Enter your name.' using errcode = '22023';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(v_email) > 254 then
    raise exception 'Enter a valid email address.' using errcode = '22023';
  end if;
  if char_length(coalesce(p_phone, '')) > 30 or char_length(coalesce(p_notes, '')) > 2000 then
    raise exception 'Some details are too long.' using errcode = '22023';
  end if;
  if p_helmet not in ('own', 'unsure') and not exists (select 1 from public.helmet_models m where m.id = p_helmet) then
    raise exception 'Choose a helmet.' using errcode = '22023';
  end if;

  if p_image_path is not null and (
    p_image_path !~ '^quotes/[0-9a-f-]{36}\.(jpg|png|webp)$'
    or not exists (select 1 from storage.objects o where o.bucket_id = 'design-uploads' and o.name = p_image_path)
  ) then
    raise exception 'Your photo didn''t upload. Please add it again.' using errcode = '22023';
  end if;

  if cardinality(coalesce(p_palette, '{}')) > 6
    or exists (select 1 from unnest(coalesce(p_palette, '{}')) c where c !~ '^#[0-9a-f]{6}$') then
    raise exception 'That design couldn''t be saved.' using errcode = '22023';
  end if;
  if cardinality(coalesce(p_suggested_products, '{}')) > 4 then
    raise exception 'That design couldn''t be saved.' using errcode = '22023';
  end if;
  if pg_column_size(coalesce(p_concept, '{}'::jsonb)) > 4000 then
    raise exception 'That design couldn''t be saved.' using errcode = '22023';
  end if;

  -- Keep the form from being used to flood the inbox.
  select count(*) into v_recent
  from public.quote_requests q
  where lower(q.email) = v_email and q.created_at > now() - interval '1 hour';
  if v_recent >= 3 then
    raise exception 'You''ve sent a few requests in the last hour. We''ll be in touch soon.' using errcode = '22023';
  end if;

  return query
  insert into public.quote_requests (
    user_id, name, email, phone, helmet, notes, image_path, palette, concept, suggested_products
  )
  values (
    auth.uid(),
    v_name,
    v_email,
    btrim(coalesce(p_phone, '')),
    p_helmet,
    btrim(coalesce(p_notes, '')),
    p_image_path,
    coalesce(p_palette, '{}'),
    coalesce(p_concept, '{}'::jsonb),
    array(
      select s from unnest(coalesce(p_suggested_products, '{}')) s
      where exists (select 1 from public.products p where p.slug = s)
    )
  )
  returning quote_requests.reference;
end;
$$;

revoke all on function public.submit_quote_request(text, text, text, text, text, text, text[], jsonb, text[]) from public;
grant execute on function public.submit_quote_request(text, text, text, text, text, text, text[], jsonb, text[])
  to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row level security: customers see their own requests, admins manage all.
-- Inserts only happen through submit_quote_request().
-- ---------------------------------------------------------------------------
alter table public.quote_requests enable row level security;

create policy "Customers read own quote requests" on public.quote_requests
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Admins update quote requests" on public.quote_requests
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Design photos: private bucket. Anyone may add a new photo under quotes/ (guests
-- included), nobody can overwrite or list them, and only admins can view them.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('design-uploads', 'design-uploads', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Design photos: anyone uploads new photos" on storage.objects
  for insert to anon, authenticated with check (
    bucket_id = 'design-uploads' and name ~ '^quotes/[0-9a-f-]{36}\.(jpg|png|webp)$'
  );
create policy "Design photos: admins view" on storage.objects
  for select to authenticated using (bucket_id = 'design-uploads' and (select public.is_admin()));
