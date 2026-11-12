-- The helmet competition's final rules (client, November 2026):
--   - entrants design on the website with at least one hydrographic film, share it in a
--     social media post tagging Lucas Racing and HydroKarts, and must live in the UK;
--   - voting happens on Facebook; the workshop records the top places here;
--   - 2nd to 5th place get 50/40/30/20% off a custom helmet finish, everyone else eligible
--     10%: single-use voucher codes, valid 12 months, entered at checkout;
--   - entry records are deleted once prizes and vouchers are issued.

-- ---------------------------------------------------------------------------
-- Entries and dates

alter table public.competitions
  add column voting_opens_at timestamptz,
  add column voting_closes_at timestamptz,
  -- Kept on the competition so the announcement survives deleting the entries.
  add column winner_name text not null default '',
  add column winner_design text not null default '';

alter table public.competition_entries
  add column post_url text not null default '' check (char_length(post_url) <= 500),
  add column uk_resident boolean not null default false,
  -- A picture of the design from the builder, for the anonymous Facebook album (design-uploads).
  add column image_path text check (image_path is null or image_path ~ '^quotes/[0-9a-f-]{36}\.(jpg|png|webp)$'),
  -- 2nd to 5th from the vote; the winner is chosen with choose_competition_winner().
  add column place smallint check (place is null or place between 2 and 5);

create unique index competition_entries_place_idx on public.competition_entries (competition_id, place) where place is not null;

-- ---------------------------------------------------------------------------
-- Entering: the only way to create or change an entry.
-- p_entry is { slug, designName, config, summary, agreedRules, marketingOptIn, ukResident, postUrl, imagePath }.

create or replace function public.enter_competition(p_competition uuid, p_entry jsonb)
returns table (reference text, updated boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_profile public.profiles;
  v_competition public.competitions;
  v_config jsonb := p_entry -> 'config';
  v_path text;
  v_post text := btrim(coalesce(p_entry ->> 'postUrl', ''));
  v_image text := nullif(btrim(coalesce(p_entry ->> 'imagePath', '')), '');
  v_existing public.competition_entries;
begin
  if v_user is null then
    raise exception 'Please log in to enter.' using errcode = '28000';
  end if;
  select * into v_profile from public.profiles where id = v_user;
  if not found then
    raise exception 'Please log in to enter.' using errcode = '28000';
  end if;

  select * into v_competition from public.competitions where id = p_competition;
  if not found
    or v_competition.status <> 'open'
    or (v_competition.opens_at is not null and now() < v_competition.opens_at)
    or (v_competition.closes_at is not null and now() >= v_competition.closes_at) then
    raise exception 'This competition isn''t taking entries right now.' using errcode = '22023';
  end if;

  if coalesce((p_entry ->> 'agreedRules')::boolean, false) is not true then
    raise exception 'Please agree to the competition rules.' using errcode = '22023';
  end if;
  if coalesce((p_entry ->> 'ukResident')::boolean, false) is not true then
    raise exception 'The competition is only open to people with a UK address.' using errcode = '22023';
  end if;
  if v_post !~ '^https?://[^[:space:]]+$' or char_length(v_post) > 500 then
    raise exception 'Add the link to your social media post.' using errcode = '22023';
  end if;
  if jsonb_typeof(v_config) <> 'object'
    or coalesce(p_entry ->> 'slug', '') !~ '^[a-z0-9-]{1,80}$'
    or char_length(btrim(coalesce(p_entry ->> 'designName', ''))) not between 1 and 60
    or pg_column_size(p_entry) > 200000 then
    raise exception 'That entry couldn''t be saved. Please try again.' using errcode = '22023';
  end if;

  -- At least one hydrographic film: on a part of the design, or on the spoilers. The
  -- customer's own printed pattern and holographic tape don't count.
  if not exists (
    select 1
    from jsonb_each(case when jsonb_typeof(v_config -> 'regions') = 'object' then v_config -> 'regions' else '{}'::jsonb end) region
    join public.films f on f.id = region.value ->> 'value'
    where region.value ->> 'kind' = 'film' and f.id <> 'bespoke-print' and f.category is distinct from 'Holographic tape'
  ) and not exists (
    select 1 from public.films f
    where v_config -> 'spoilerFinish' ->> 'kind' = 'film' and f.id = v_config -> 'spoilerFinish' ->> 'value'
      and f.id <> 'bespoke-print' and f.category is distinct from 'Holographic tape'
  ) then
    raise exception 'Your design needs at least one hydrographic film. Add one in Colours & films.' using errcode = '22023';
  end if;

  if v_image is not null and (
    v_image !~ '^quotes/[0-9a-f-]{36}\.(jpg|png|webp)$'
    or not exists (select 1 from storage.objects o where o.bucket_id = 'design-uploads' and o.name = v_image)
  ) then
    raise exception 'The picture of your design didn''t upload. Please try again.' using errcode = '22023';
  end if;

  -- Images and prints must be the entrant's own uploads.
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

  select * into v_existing from public.competition_entries e where e.competition_id = p_competition and e.user_id = v_user;
  if found and v_existing.status = 'disqualified' then
    raise exception 'Your entry can''t be changed. Please contact us.' using errcode = '22023';
  end if;

  return query
  insert into public.competition_entries as e (
    competition_id, user_id, name, email, design_name, product_slug, config, summary, marketing_opt_in, agreed_rules_at,
    uk_resident, post_url, image_path
  )
  values (
    p_competition,
    v_user,
    coalesce(nullif(btrim(v_profile.full_name), ''), split_part(v_profile.email, '@', 1)),
    lower(btrim(v_profile.email)),
    btrim(p_entry ->> 'designName'),
    p_entry ->> 'slug',
    v_config,
    case when jsonb_typeof(p_entry -> 'summary') = 'array' then p_entry -> 'summary' else '[]'::jsonb end,
    coalesce((p_entry ->> 'marketingOptIn')::boolean, false),
    now(),
    true,
    v_post,
    v_image
  )
  on conflict (competition_id, user_id) do update set
    design_name = excluded.design_name,
    product_slug = excluded.product_slug,
    config = excluded.config,
    summary = excluded.summary,
    marketing_opt_in = excluded.marketing_opt_in,
    agreed_rules_at = excluded.agreed_rules_at,
    uk_resident = excluded.uk_resident,
    post_url = excluded.post_url,
    -- A new picture replaces the old one; none sent keeps the one there is.
    image_path = coalesce(excluded.image_path, e.image_path),
    name = excluded.name,
    email = excluded.email
  returning e.reference, (v_existing.id is not null);
end;
$$;

revoke all on function public.enter_competition(uuid, jsonb) from public;
grant execute on function public.enter_competition(uuid, jsonb) to authenticated;

-- The winner also goes on the competition itself, so the announcement stays up once the
-- entry records are deleted.
create or replace function public.choose_competition_winner(p_entry uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_entry public.competition_entries;
begin
  if not (select public.is_admin()) then
    raise exception 'You don''t have permission to do that.' using errcode = '42501';
  end if;
  select * into v_entry from public.competition_entries where id = p_entry;
  if not found or v_entry.status = 'disqualified' then
    raise exception 'That entry can''t win.' using errcode = '22023';
  end if;
  update public.competition_entries set status = 'shortlisted'
  where competition_id = v_entry.competition_id and status = 'winner' and id <> p_entry;
  update public.competition_entries set status = 'winner', place = null where id = p_entry;
  update public.competitions
  set winner_entry_id = p_entry, status = 'judged',
    winner_name = split_part(v_entry.name, ' ', 1), winner_design = v_entry.design_name
  where id = v_entry.competition_id;
end;
$$;

revoke all on function public.choose_competition_winner(uuid) from public;
grant execute on function public.choose_competition_winner(uuid) to authenticated;

create or replace function public.competition_winner(p_competition uuid)
returns table (first_name text, design_name text, product_slug text)
language sql
stable
security definer
set search_path = ''
as $$
  select c.winner_name, c.winner_design, coalesce(e.product_slug, '')
  from public.competitions c
  left join public.competition_entries e on e.id = c.winner_entry_id
  where c.id = p_competition and c.status = 'judged' and c.winner_name <> '';
$$;

revoke all on function public.competition_winner(uuid) from public;
grant execute on function public.competition_winner(uuid) to anon, authenticated;

-- Once prizes and vouchers are issued: deletes the competition's entries (vouchers stay)
-- and returns their pictures' paths, which the admin action removes from storage.
create or replace function public.delete_competition_entries(p_competition uuid)
returns table (image_path text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.is_full_admin()) then
    raise exception 'You don''t have permission to do that.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.competitions c where c.id = p_competition and c.status = 'judged') then
    raise exception 'Choose the winner before deleting the entries.' using errcode = '22023';
  end if;
  return query
  delete from public.competition_entries e where e.competition_id = p_competition
  returning e.image_path;
end;
$$;

revoke all on function public.delete_competition_entries(uuid) from public;
grant execute on function public.delete_competition_entries(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Vouchers: a percentage off one custom helmet finish, single use, for one customer.

create table public.vouchers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9-]{6,24}$'),
  user_id uuid not null references public.profiles (id) on delete cascade,
  percent_off smallint not null check (percent_off between 1 and 100),
  description text not null default '' check (char_length(description) <= 200),
  competition_id uuid references public.competitions (id) on delete set null,
  competition_entry_id uuid references public.competition_entries (id) on delete set null,
  expires_at timestamptz not null,
  redeemed_at timestamptz,
  order_id uuid references public.orders (id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index vouchers_competition_entry_idx on public.vouchers (competition_entry_id) where competition_entry_id is not null;
create index vouchers_user_idx on public.vouchers (user_id);

alter table public.vouchers enable row level security;
create policy "Customers read their own vouchers" on public.vouchers
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));

alter table public.orders
  add column discount_amount numeric(10, 2) not null default 0 check (discount_amount >= 0),
  add column voucher_code text;

-- Gives every eligible entrant their voucher once the vote is in: 2nd to 5th get 50, 40,
-- 30 and 20%, everyone else not disqualified 10%. The winner gets the helmet instead.
-- Entrants who already have one are skipped, so it can be run again after changes.
create or replace function public.issue_competition_vouchers(p_competition uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if not (select public.is_admin()) then
    raise exception 'You don''t have permission to do that.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.competitions c where c.id = p_competition and c.status = 'judged') then
    raise exception 'Choose the winner before issuing vouchers.' using errcode = '22023';
  end if;

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
    and not exists (select 1 from public.vouchers v where v.competition_entry_id = e.id);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.issue_competition_vouchers(uuid) from public;
grant execute on function public.issue_competition_vouchers(uuid) to authenticated;

-- A customer's voucher, if it can be used now. Checkout shows the discount from this;
-- place_order_with_voucher() checks it again and applies it.
create or replace function public.check_voucher(p_code text)
returns table (code text, percent_off smallint, expires_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_voucher public.vouchers;
begin
  if auth.uid() is null then
    raise exception 'Please log in to use a voucher.' using errcode = '28000';
  end if;
  select * into v_voucher from public.vouchers v where v.code = upper(btrim(coalesce(p_code, '')));
  if not found or v_voucher.user_id <> auth.uid() then
    raise exception 'That voucher code isn''t valid.' using errcode = '22023';
  end if;
  if v_voucher.redeemed_at is not null then
    raise exception 'That voucher has already been used.' using errcode = '22023';
  end if;
  if v_voucher.expires_at <= now() then
    raise exception 'That voucher has expired.' using errcode = '22023';
  end if;
  return query select v_voucher.code, v_voucher.percent_off, v_voucher.expires_at;
end;
$$;

revoke all on function public.check_voucher(text) from public;
grant execute on function public.check_voucher(text) to authenticated;

-- The deposit: 10% of the order, plus the chrome base coat in full for each chrome helmet.
-- One function, so a discounted order's deposit is worked out the same way.
create or replace function public.order_deposit_amount(p_order uuid)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select round(o.total * 0.10, 2)
    + coalesce((select c.price from public.configurator_options c where c.option_group = 'material' and c.value = 'chrome' limit 1), 0)
    * (
      select coalesce(sum(i.quantity), 0)
      from public.order_items i
      where i.order_id = o.id and i.line_kind = 'helmet' and i.configuration -> 'values' ->> 'baseCoat' = 'chrome'
    )
  from public.orders o
  where o.id = p_order;
$$;

create or replace function public.order_items_set_deposit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.orders o set deposit_amount = public.order_deposit_amount(o.id) where o.id = new.order_id;
  return null;
end;
$$;

-- Places an order with a voucher: place_order() as usual, then the voucher's percentage
-- off the custom finish of one helmet (the dearest; a new helmet shell bought with it isn't
-- discounted), all in one transaction. Without a code it's just place_order().
create or replace function public.place_order_with_voucher(
  p_items jsonb,
  p_customer jsonb,
  p_shipping jsonb,
  p_delivery_method text,
  p_notes text,
  p_production jsonb,
  p_voucher text
)
returns table (order_id uuid, order_number text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text := upper(btrim(coalesce(p_voucher, '')));
  v_voucher public.vouchers;
  v_order_id uuid;
  v_order_number text;
  v_finish numeric(10, 2);
  v_discount numeric(10, 2);
begin
  if v_code = '' then
    return query select * from public.place_order(p_items, p_customer, p_shipping, p_delivery_method, p_notes, p_production);
    return;
  end if;

  select * into v_voucher from public.vouchers v where v.code = v_code for update;
  if not found or v_voucher.user_id is distinct from auth.uid() then
    raise exception 'That voucher code isn''t valid.' using errcode = '22023';
  end if;
  if v_voucher.redeemed_at is not null then
    raise exception 'That voucher has already been used.' using errcode = '22023';
  end if;
  if v_voucher.expires_at <= now() then
    raise exception 'That voucher has expired.' using errcode = '22023';
  end if;

  select p.order_id, p.order_number into v_order_id, v_order_number
  from public.place_order(p_items, p_customer, p_shipping, p_delivery_method, p_notes, p_production) p;

  select max(greatest(0, i.unit_price - case when i.configuration -> 'values' ->> 'route' = 'new' then coalesce(m.new_helmet_price, 0) else 0 end))
  into v_finish
  from public.order_items i
  left join public.helmet_models m on m.id = i.configuration -> 'values' ->> 'model'
  where i.order_id = v_order_id and i.line_kind = 'helmet';
  if v_finish is null or v_finish <= 0 then
    raise exception 'That voucher is for a custom helmet finish. Add a helmet from the builder to use it.' using errcode = '22023';
  end if;

  v_discount := round(v_finish * v_voucher.percent_off / 100.0, 2);
  update public.orders o
  set discount_amount = v_discount, voucher_code = v_voucher.code, total = o.total - v_discount
  where o.id = v_order_id;
  update public.orders o set deposit_amount = public.order_deposit_amount(o.id) where o.id = v_order_id;
  update public.vouchers v set redeemed_at = now(), order_id = v_order_id where v.id = v_voucher.id;

  return query select v_order_id, v_order_number;
end;
$$;

revoke all on function public.place_order_with_voucher(jsonb, jsonb, jsonb, text, text, jsonb, text) from public;
grant execute on function public.place_order_with_voucher(jsonb, jsonb, jsonb, text, text, jsonb, text) to authenticated;

-- ---------------------------------------------------------------------------
-- The competition as the client has written it. Everything here stays editable in admin.

update public.competitions
set
  title = 'Design your helmet and win a custom Arai SK-6',
  prize = 'A brand-new Arai SK-6 finished in your winning design, with a spoiler and clear visor. We''ll cover UK postage if needed.',
  description = 'Design a helmet in the Lucas Racing design studio and you could win a brand-new Arai SK-6 finished in your winning design, complete with a spoiler and clear visor. Every other eligible entrant gets a discount voucher towards their own custom helmet finish.',
  rules = array[
    'Entry is free and open to anyone with a UK address. No purchase is necessary.',
    'Entries open on Saturday 14 November 2026 and close at 11:59 pm UK time on Friday 1 January 2027.',
    'Design your own helmet on the Lucas Racing website and include at least one hydrographic film. We can see which film you''ve chosen in the design studio, so there''s no need to tell us separately.',
    'Share your finished design in a social media post from your own account and tag both Lucas Racing and HydroKarts. Keep your post visible until the winner is announced. Disappearing stories don''t count.',
    'One entry and one vote per person. Enter and vote under your own name using your own account. You can''t use a made-up name or use someone else''s account, including a friend''s or parent''s, to enter or vote. We''ll check entries and votes to keep the competition fair. Duplicate entries and votes won''t count.',
    'We''ll display all eligible helmet designs on Facebook without entrants'' names attached. Voting opens on Saturday 2 January 2027 and closes at 11:59 pm UK time on Friday 8 January 2027.',
    'Every eligible entrant gets one vote for their favourite design. You can''t vote for your own helmet. The design with the most votes wins.',
    'If there''s a tie for first place, Howard Lucas, Kat Franklin and Mark Mitchel will choose the winner from the tied designs. We''ll announce the winner on Saturday 9 January 2027.',
    'Prizes: 1st place, a brand-new Arai SK-6 finished in your winning design, with a spoiler and clear visor (we''ll cover UK postage if needed). 2nd place, 50% off your custom helmet finish. 3rd place, 40%. 4th place, 30%. 5th place, 20%. 6th place onwards, 10%.',
    'Your voucher is valid for 12 months from the date it''s issued. Place your order within those 12 months and we''ll book your helmet in for its custom finish.',
    'The design studio shows the retail price as you build your helmet. The price updates on screen as you choose options such as a spoiler, hydrographic film or chrome.',
    'We''ll start work on the winning helmet in January 2027. The build takes around eight weeks, with delivery expected in early March 2027. If the winning design includes chrome, allow three extra weeks, with delivery expected in late March 2027.',
    'We''ll use your entry details to run the competition, check entries and votes, and issue prizes and vouchers. Once the competition is over and prizes and vouchers have been issued, we''ll delete the entry records. We''ll ask the winner separately for the delivery details we need to send their helmet.'
  ],
  opens_at = '2026-11-14 00:00:00 Europe/London',
  closes_at = '2027-01-01 23:59:59 Europe/London',
  voting_opens_at = '2027-01-02 00:00:00 Europe/London',
  voting_closes_at = '2027-01-08 23:59:59 Europe/London',
  judging_date = '2027-01-09',
  status = 'open'
where slug = 'arai-sk6';
