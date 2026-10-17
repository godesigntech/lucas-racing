-- AI design assistant: the AI concept image saved with a quote request, and a
-- per-visitor limit on AI image generation. Visitors are identified only by a
-- one-way hash of their connection, worked out on the server.

alter table public.quote_requests
  add column ai_image_path text check (ai_image_path is null or ai_image_path ~ '^quotes/[0-9a-f-]{36}\.(jpg|png|webp)$');

-- Quote requests now accept the AI concept image.
drop function public.submit_quote_request(text, text, text, text, text, text, text[], jsonb, text[]);

create or replace function public.submit_quote_request(
  p_name text,
  p_email text,
  p_phone text,
  p_helmet text,
  p_notes text,
  p_image_path text,
  p_palette text[],
  p_concept jsonb,
  p_suggested_products text[],
  p_ai_image_path text default null
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

  -- The AI concept image is saved to the same private bucket by the browser.
  if p_ai_image_path is not null and (
    p_ai_image_path !~ '^quotes/[0-9a-f-]{36}\.(jpg|png|webp)$'
    or not exists (select 1 from storage.objects o where o.bucket_id = 'design-uploads' and o.name = p_ai_image_path)
  ) then
    raise exception 'Your AI concept didn''t upload. Please try again.' using errcode = '22023';
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
    user_id, name, email, phone, helmet, notes, image_path, ai_image_path, palette, concept, suggested_products
  )
  values (
    auth.uid(),
    v_name,
    v_email,
    btrim(coalesce(p_phone, '')),
    p_helmet,
    btrim(coalesce(p_notes, '')),
    p_image_path,
    p_ai_image_path,
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

revoke all on function public.submit_quote_request(text, text, text, text, text, text, text[], jsonb, text[], text) from public;
grant execute on function public.submit_quote_request(text, text, text, text, text, text, text[], jsonb, text[], text)
  to anon, authenticated;

-- ---------------------------------------------------------------------------
-- AI usage: one row per AI image started. Only claim_ai_use() reads or writes it.
-- ---------------------------------------------------------------------------
create table public.ai_usage (
  id bigint generated always as identity primary key,
  visitor_key text not null check (char_length(visitor_key) between 16 and 128),
  kind text not null check (kind in ('image')),
  created_at timestamptz not null default now()
);

create index ai_usage_visitor_idx on public.ai_usage (visitor_key, kind, created_at desc);

alter table public.ai_usage enable row level security;
-- No policies: nobody reads or writes the table directly.

/**
 * Records one AI use for a visitor if they're under the limit for the window.
 * Returns false (and records nothing) when the limit is reached.
 */
create or replace function public.claim_ai_use(p_visitor text, p_kind text, p_limit integer, p_window_minutes integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_used integer;
begin
  if p_kind not in ('image') or p_limit not between 1 and 100 or p_window_minutes not between 1 and 1440 then
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

revoke all on function public.claim_ai_use(text, text, integer, integer) from public;
grant execute on function public.claim_ai_use(text, text, integer, integer) to anon, authenticated;
