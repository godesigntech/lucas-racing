-- Priced builds and bespoke builds.
--
-- A build made only from a template, colours and finishes has a price and can be
-- ordered straight away. As soon as it carries a bespoke image or a dip (a film on
-- the shell or the spoilers) the workshop prices it by hand: the customer sends it
-- as a quote request, an admin sets the price, and the customer is emailed it.
--
-- Either way the customer pays a 20% deposit, plus £200 for each helmet with a
-- chrome base coat. Holographic tape on the racing lines is not a dip.

-- True when the workshop must price this build by hand. The same rule as
-- quoteReasons() in src/lib/configurator/pricing-rules.ts.
create or replace function public.build_needs_quote(p_values jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    -- A film on any part of the shell, other than holographic tape.
    exists (
      select 1 from jsonb_each(case when jsonb_typeof(p_values -> 'regions') = 'object' then p_values -> 'regions' else '{}'::jsonb end) region
      where region.value ->> 'kind' = 'film' and coalesce(region.value ->> 'value', '') not like 'holo-%'
    )
    or 'film' in (p_values ->> 'baseKind', p_values ->> 'graphicKind', p_values ->> 'accentKind')
    -- A dipped spoiler.
    or (
      p_values -> 'spoilerFinish' ->> 'kind' = 'film'
      and jsonb_typeof(p_values -> 'spoilers') = 'array'
      and jsonb_array_length(p_values -> 'spoilers') > 0
    )
    -- A bespoke image.
    or exists (
      select 1 from jsonb_array_elements(case when jsonb_typeof(p_values -> 'logos') = 'array' then p_values -> 'logos' else '[]'::jsonb end) logo
      where logo ->> 'kind' = 'image'
    );
$$;

-- ---------------------------------------------------------------------------
-- Orders: bespoke builds can't be ordered at a set price, and every order
-- records the deposit due.

alter table public.orders add column deposit_amount numeric(10, 2) not null default 0;

create or replace function public.order_items_reject_bespoke()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.line_kind = 'helmet' and public.build_needs_quote(coalesce(new.configuration -> 'values', '{}'::jsonb)) then
    raise exception 'This design has a bespoke image or a dip, so it needs a quote. Please send it to us from the builder.' using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger order_items_reject_bespoke before insert on public.order_items
  for each row execute function public.order_items_reject_bespoke();

-- 20% of the order total, plus £200 for each chrome base-coated helmet.
create or replace function public.order_items_set_deposit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.orders o
  set deposit_amount = round(o.total * 0.20, 2) + 200 * (
    select coalesce(sum(i.quantity), 0)
    from public.order_items i
    where i.order_id = o.id and i.line_kind = 'helmet' and i.configuration -> 'values' ->> 'baseCoat' = 'chrome'
  )
  where o.id = new.order_id;
  return null;
end;
$$;

create trigger order_items_set_deposit after insert on public.order_items
  for each row execute function public.order_items_set_deposit();

revoke all on function public.order_items_set_deposit() from public;

-- ---------------------------------------------------------------------------
-- Quote requests for bespoke builds: the design itself, and the price the
-- workshop sends back.

alter table public.quote_requests drop constraint quote_requests_kind_check;
alter table public.quote_requests
  add constraint quote_requests_kind_check check (kind in ('design', 'own_helmet', 'build')),
  add column quoted_price numeric(10, 2) check (quoted_price is null or quoted_price > 0),
  add column quoted_deposit numeric(10, 2) check (quoted_deposit is null or quoted_deposit >= 0),
  add column quoted_at timestamptz;

-- Customers read their own requests' prices (they already read the rows).
-- Admins set them through the existing "Admins update quote requests" policy.

-- The only way to send a build for a quote. The customer must be signed in; their
-- contact details come from their profile. p_build is { slug, name, config, summary }.
create or replace function public.submit_build_quote(p_build jsonb, p_notes text)
returns table (reference text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_profile public.profiles;
  v_config jsonb := p_build -> 'config';
  v_path text;
  v_recent integer;
begin
  if v_user is null then
    raise exception 'Please log in to send your design.' using errcode = '28000';
  end if;
  select * into v_profile from public.profiles where id = v_user;
  if not found then
    raise exception 'Please log in to send your design.' using errcode = '28000';
  end if;

  if jsonb_typeof(p_build) <> 'object' or jsonb_typeof(v_config) <> 'object'
    or coalesce(p_build ->> 'slug', '') !~ '^[a-z0-9-]{1,80}$'
    or pg_column_size(p_build) > 200000 then
    raise exception 'That design couldn''t be sent. Please try again.' using errcode = '22023';
  end if;
  if char_length(coalesce(p_notes, '')) > 2000 then
    raise exception 'Please keep your notes under 2,000 characters.' using errcode = '22023';
  end if;

  -- Images and prints must be the customer's own uploads.
  for v_path in
    select logo ->> 'path' from jsonb_array_elements(case when jsonb_typeof(v_config -> 'logos') = 'array' then v_config -> 'logos' else '[]'::jsonb end) logo
    union all
    select region.value ->> 'print' from jsonb_each(case when jsonb_typeof(v_config -> 'regions') = 'object' then v_config -> 'regions' else '{}'::jsonb end) region
  loop
    continue when v_path is null;
    if v_path !~ ('^' || v_user::text || '/[0-9a-f-]{36}\.(png|jpg|webp)$')
      or not exists (select 1 from storage.objects o where o.bucket_id = 'design-logos' and o.name = v_path) then
      raise exception 'One of your images didn''t upload. Please add it again.' using errcode = '22023';
    end if;
  end loop;

  -- Keep the form from being used to flood the workshop.
  select count(*) into v_recent
  from public.quote_requests q
  where q.user_id = v_user and q.kind = 'build' and q.created_at > now() - interval '1 hour';
  if v_recent >= 5 then
    raise exception 'You''ve sent a few designs in the last hour. We''ll be in touch soon.' using errcode = '22023';
  end if;

  return query
  insert into public.quote_requests (user_id, name, email, phone, helmet, notes, kind, details)
  values (
    v_user,
    coalesce(nullif(btrim(v_profile.full_name), ''), split_part(v_profile.email, '@', 1)),
    lower(btrim(v_profile.email)),
    btrim(coalesce(v_profile.phone, '')),
    left(coalesce(v_config ->> 'model', 'unsure'), 40),
    btrim(coalesce(p_notes, '')),
    'build',
    jsonb_build_object(
      'slug', p_build ->> 'slug',
      'name', left(coalesce(p_build ->> 'name', ''), 80),
      'config', v_config,
      'summary', case when jsonb_typeof(p_build -> 'summary') = 'array' then p_build -> 'summary' else '[]'::jsonb end
    )
  )
  returning quote_requests.reference;
end;
$$;

revoke all on function public.submit_build_quote(jsonb, text) from public;
grant execute on function public.submit_build_quote(jsonb, text) to authenticated;
