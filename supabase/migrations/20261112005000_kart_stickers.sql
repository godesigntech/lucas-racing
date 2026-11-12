-- Kart sticker kits designed with AI (/kart-stickers). A signed-in customer picks a blank
-- layout for their kart, describes the design (plus race number, driver name, logos and
-- finish) and the AI paints it onto the layout. Each design is kept; the customer sends
-- the one they like to the workshop as a quote request (kind 'kart_stickers').

-- AI designs count against their own daily limit, kept by the server (claim_ai_use()).
alter table public.ai_usage drop constraint ai_usage_kind_check;
alter table public.ai_usage add constraint ai_usage_kind_check check (kind in ('image', 'kart'));

create or replace function public.claim_ai_use(p_visitor text, p_kind text, p_limit integer, p_window_minutes integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_used integer;
begin
  if p_kind not in ('image', 'kart') or p_limit not between 1 and 100 or p_window_minutes not between 1 and 1440 then
    raise exception 'Invalid limit.' using errcode = '22023';
  end if;

  -- Serialise claims for the same visitor so parallel requests can't slip past the limit.
  perform pg_advisory_xact_lock(hashtext(p_visitor || ':' || p_kind));

  select count(*) into v_used
  from public.ai_usage u
  where u.visitor_key = p_visitor and u.kind = p_kind
    and u.created_at > now() - make_interval(mins => p_window_minutes);
  if v_used >= p_limit then
    return false;
  end if;

  insert into public.ai_usage (visitor_key, kind) values (p_visitor, p_kind);
  -- Keep the table small: usage older than two days is no longer needed.
  delete from public.ai_usage where created_at < now() - interval '2 days';
  return true;
end;
$$;

revoke all on function public.claim_ai_use(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.claim_ai_use(text, text, integer, integer) to service_role;

-- Each AI design a customer makes. Written by the server (with the secret key) once the
-- picture is saved; customers read and delete their own.
create table public.kart_sticker_designs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  layout text not null check (layout ~ '^[a-z0-9-]{1,40}$'),
  kart_model text not null check (char_length(kart_model) between 2 and 80),
  prompt text not null check (char_length(prompt) between 3 and 1000),
  race_number text not null default '' check (char_length(race_number) <= 4),
  driver_name text not null default '' check (char_length(driver_name) <= 40),
  finish text not null check (finish in ('gloss', 'matt', 'holographic', 'chrome')),
  logos text[] not null default '{}' check (cardinality(logos) <= 4),
  image_path text not null check (image_path ~ '^kart/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'),
  created_at timestamptz not null default now()
);

create index kart_sticker_designs_user_idx on public.kart_sticker_designs (user_id, created_at desc);

alter table public.kart_sticker_designs enable row level security;
create policy "Customers read their own kart designs" on public.kart_sticker_designs
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Customers delete their own kart designs" on public.kart_sticker_designs
  for delete to authenticated using (user_id = (select auth.uid()));

-- Requests for a quote on a kart sticker kit live with the other quote requests.
alter table public.quote_requests drop constraint quote_requests_kind_check;
alter table public.quote_requests
  add constraint quote_requests_kind_check check (kind in ('design', 'own_helmet', 'build', 'kart_stickers'));

-- The only way to send a kart design for a quote: one of the customer's own designs, with
-- an optional note. Contact details come from their profile.
create or replace function public.submit_kart_sticker_request(p_design uuid, p_notes text)
returns table (reference text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_profile public.profiles;
  v_design public.kart_sticker_designs;
  v_recent integer;
begin
  if v_user is null then
    raise exception 'Please log in to send your design.' using errcode = '28000';
  end if;
  select * into v_profile from public.profiles where id = v_user;
  if not found then
    raise exception 'Please log in to send your design.' using errcode = '28000';
  end if;

  select * into v_design from public.kart_sticker_designs d where d.id = p_design and d.user_id = v_user;
  if not found then
    raise exception 'That design couldn''t be found. Please make it again.' using errcode = '22023';
  end if;
  if char_length(coalesce(p_notes, '')) > 2000 then
    raise exception 'Please keep your notes under 2,000 characters.' using errcode = '22023';
  end if;

  select count(*) into v_recent
  from public.quote_requests q
  where q.user_id = v_user and q.kind = 'kart_stickers' and q.created_at > now() - interval '1 hour';
  if v_recent >= 5 then
    raise exception 'You''ve sent a few designs in the last hour. We''ll be in touch soon.' using errcode = '22023';
  end if;

  return query
  insert into public.quote_requests (user_id, name, email, phone, helmet, notes, image_path, kind, details)
  values (
    v_user,
    coalesce(nullif(btrim(v_profile.full_name), ''), split_part(v_profile.email, '@', 1)),
    lower(btrim(v_profile.email)),
    btrim(coalesce(v_profile.phone, '')),
    'kart',
    btrim(coalesce(p_notes, '')),
    v_design.image_path,
    'kart_stickers',
    jsonb_build_object(
      'designId', v_design.id,
      'layout', v_design.layout,
      'kartModel', v_design.kart_model,
      'prompt', v_design.prompt,
      'raceNumber', v_design.race_number,
      'driverName', v_design.driver_name,
      'finish', v_design.finish,
      'logos', to_jsonb(v_design.logos)
    )
  )
  returning quote_requests.reference;
end;
$$;

revoke all on function public.submit_kart_sticker_request(uuid, text) from public;
grant execute on function public.submit_kart_sticker_request(uuid, text) to authenticated;
