-- Lucas Racing: Phase 1 completion.
-- Contact enquiries, saved designs, staff roles (Admin / Sales), helmet
-- personalisation (name, race number, logo) and admin film image uploads.

-- ---------------------------------------------------------------------------
-- Staff roles. Everyone on the allowlist is staff (is_admin() stays true for
-- them). Only full admins manage the catalogue, prices, settings and the team;
-- Sales handle orders, customers, messages, quotes and enquiries.
-- ---------------------------------------------------------------------------
alter table public.admin_users
  add column role text not null default 'admin' check (role in ('admin', 'sales'));

create or replace function public.is_full_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users a
    where a.email = lower(coalesce(auth.jwt() ->> 'email', '')) and a.role = 'admin'
  );
$$;

revoke all on function public.is_full_admin() from public;
grant execute on function public.is_full_admin() to anon, authenticated;

drop policy "Admins update site settings" on public.site_settings;
create policy "Admins update site settings" on public.site_settings
  for update to authenticated using ((select public.is_full_admin())) with check ((select public.is_full_admin()));

drop policy "Admins manage helmet models" on public.helmet_models;
create policy "Admins manage helmet models" on public.helmet_models
  for all to authenticated using ((select public.is_full_admin())) with check ((select public.is_full_admin()));

drop policy "Admins manage products" on public.products;
create policy "Admins manage products" on public.products
  for all to authenticated using ((select public.is_full_admin())) with check ((select public.is_full_admin()));

drop policy "Admins manage films" on public.films;
create policy "Admins manage films" on public.films
  for all to authenticated using ((select public.is_full_admin())) with check ((select public.is_full_admin()));

drop policy "Admins manage options" on public.configurator_options;
create policy "Admins manage options" on public.configurator_options
  for all to authenticated using ((select public.is_full_admin())) with check ((select public.is_full_admin()));

drop policy "Admins add admins" on public.admin_users;
create policy "Admins add admins" on public.admin_users
  for insert to authenticated with check ((select public.is_full_admin()));
drop policy "Admins remove admins" on public.admin_users;
create policy "Admins remove admins" on public.admin_users
  for delete to authenticated using ((select public.is_full_admin()));
create policy "Admins change roles" on public.admin_users
  for update to authenticated using ((select public.is_full_admin())) with check ((select public.is_full_admin()));

-- ---------------------------------------------------------------------------
-- Contact enquiries
-- ---------------------------------------------------------------------------
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  name text not null,
  email text not null,
  phone text not null default '',
  topic text not null,
  design text not null default '',
  message text not null,
  status text not null default 'new' check (status in ('new', 'replied', 'closed')),
  admin_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index contact_messages_created_at_idx on public.contact_messages (created_at desc);
create index contact_messages_email_created_idx on public.contact_messages (lower(email), created_at desc);

create trigger contact_messages_updated_at before update on public.contact_messages
  for each row execute function public.set_updated_at();

create or replace function public.submit_contact_message(
  p_name text,
  p_email text,
  p_phone text,
  p_topic text,
  p_design text,
  p_message text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_name text := btrim(coalesce(p_name, ''));
  v_message text := btrim(coalesce(p_message, ''));
  v_id uuid;
begin
  if char_length(v_name) not between 2 and 80 then
    raise exception 'Enter your name.' using errcode = '22023';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(v_email) > 254 then
    raise exception 'Enter a valid email address.' using errcode = '22023';
  end if;
  if char_length(v_message) not between 20 and 2000 then
    raise exception 'Please write between 20 and 2,000 characters.' using errcode = '22023';
  end if;
  if char_length(coalesce(p_phone, '')) > 30 or char_length(coalesce(p_topic, '')) > 40 or char_length(coalesce(p_design, '')) > 80 then
    raise exception 'Some details are too long.' using errcode = '22023';
  end if;
  if (
    select count(*) from public.contact_messages c
    where lower(c.email) = v_email and c.created_at > now() - interval '1 hour'
  ) >= 5 then
    raise exception 'You''ve sent a few messages in the last hour. We''ll reply soon.' using errcode = '22023';
  end if;

  insert into public.contact_messages (user_id, name, email, phone, topic, design, message)
  values (auth.uid(), v_name, v_email, btrim(coalesce(p_phone, '')), coalesce(p_topic, ''), coalesce(p_design, ''), v_message)
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.submit_contact_message(text, text, text, text, text, text) from public;
grant execute on function public.submit_contact_message(text, text, text, text, text, text) to anon, authenticated;

alter table public.contact_messages enable row level security;
create policy "Staff read enquiries" on public.contact_messages
  for select to authenticated using ((select public.is_admin()));
create policy "Staff update enquiries" on public.contact_messages
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Saved designs: a customer's builds, kept in their account.
-- ---------------------------------------------------------------------------
create table public.saved_designs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  product_slug text not null,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  config jsonb not null check (pg_column_size(config) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index saved_designs_user_idx on public.saved_designs (user_id, updated_at desc);

create trigger saved_designs_updated_at before update on public.saved_designs
  for each row execute function public.set_updated_at();

alter table public.saved_designs enable row level security;
create policy "Customers read own designs" on public.saved_designs
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Customers save designs" on public.saved_designs
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Customers rename own designs" on public.saved_designs
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Customers delete own designs" on public.saved_designs
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Storage: customer logos (private, own folder) and film images (public, admin upload).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('design-logos', 'design-logos', false, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "Logos: customers upload to own folder" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'design-logos' and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "Logos: customers read own, staff read all" on storage.objects
  for select to authenticated using (
    bucket_id = 'design-logos'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin()))
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('film-images', 'film-images', true, 2097152, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "Film images: admins upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'film-images' and (select public.is_full_admin()));
create policy "Film images: admins replace" on storage.objects
  for update to authenticated using (bucket_id = 'film-images' and (select public.is_full_admin()));
create policy "Film images: admins remove" on storage.objects
  for delete to authenticated using (bucket_id = 'film-images' and (select public.is_full_admin()));

-- ---------------------------------------------------------------------------
-- Checkout: rider name, race number and logo travel with each helmet and
-- appear on the order. They're free; the workshop places them on the proof.
-- ---------------------------------------------------------------------------
create or replace function public.place_order(
  p_items jsonb,
  p_customer jsonb,
  p_shipping jsonb,
  p_delivery_method text,
  p_notes text default ''
)
returns table (order_id uuid, order_number text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_item jsonb;
  v_cfg jsonb;
  v_product public.products;
  v_model public.helmet_models;
  v_film public.films;
  v_option public.configurator_options;
  v_group text;
  v_qty integer;
  v_unit numeric(10, 2);
  v_subtotal numeric(10, 2) := 0;
  v_summary jsonb;
  v_lines jsonb := '[]'::jsonb;
  v_delivery jsonb;
  v_delivery_price numeric(10, 2);
  v_order_id uuid;
  v_order_number text;
  v_rider_name text;
  v_race_number text;
  v_logo text;
  v_group_labels constant jsonb := jsonb_build_object(
    'route', 'How you''d like it',
    'finish', 'Base finish',
    'base', 'Base colour',
    'trim', 'Rubber trim',
    'spoiler', 'Rear spoiler'
  );
begin
  if v_user is null then
    raise exception 'Please sign in to place an order.' using errcode = '28000';
  end if;

  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your basket is empty.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) > 20 then
    raise exception 'Too many items in one order.' using errcode = '22023';
  end if;

  if coalesce(trim(p_customer ->> 'name'), '') = '' or coalesce(trim(p_customer ->> 'email'), '') = '' then
    raise exception 'Name and email are required.' using errcode = '22023';
  end if;

  select d.value into v_delivery
  from public.site_settings s
  cross join lateral jsonb_array_elements(s.delivery_methods) as d(value)
  where d.value ->> 'id' = p_delivery_method and coalesce((d.value ->> 'active')::boolean, true)
  limit 1;
  if v_delivery is null then
    raise exception 'Please choose a delivery option.' using errcode = '22023';
  end if;
  v_delivery_price := coalesce((v_delivery ->> 'price')::numeric, 0);

  if (v_delivery ->> 'requires_address')::boolean is not false
     and (coalesce(trim(p_shipping ->> 'line1'), '') = '' or coalesce(trim(p_shipping ->> 'postcode'), '') = '') then
    raise exception 'A delivery address is required for this delivery option.' using errcode = '22023';
  end if;

  for v_item in select item.value from jsonb_array_elements(p_items) as item(value)
  loop
    v_cfg := v_item -> 'config';
    v_qty := coalesce((v_item ->> 'quantity')::integer, 1);
    if v_qty < 1 or v_qty > 10 then
      raise exception 'Quantities must be between 1 and 10.' using errcode = '22023';
    end if;

    select * into v_product from public.products where slug = v_item ->> 'slug' and is_active;
    if not found then
      raise exception 'A design in your basket is no longer available.' using errcode = '22023';
    end if;
    if v_product.base_price is null then
      raise exception '% is priced on request. Please send us an enquiry instead.', v_product.name using errcode = '22023';
    end if;

    if not ((v_cfg ->> 'model') = any (v_product.model_ids)) then
      raise exception '% is not available on that helmet.', v_product.name using errcode = '22023';
    end if;
    select * into v_model from public.helmet_models where id = v_cfg ->> 'model' and is_active;
    if not found then
      raise exception 'That helmet model is no longer available.' using errcode = '22023';
    end if;
    if not ((v_cfg ->> 'size') = any (v_model.sizes)) then
      raise exception 'Please choose a valid helmet size.' using errcode = '22023';
    end if;

    select * into v_film from public.films where id = v_cfg ->> 'film' and is_active;
    if not found then
      raise exception 'That hydro-dip film is no longer available.' using errcode = '22023';
    end if;

    v_unit := v_product.base_price + v_film.price;
    v_summary := jsonb_build_array(
      jsonb_build_object('label', 'Helmet', 'value', v_model.name),
      jsonb_build_object('label', 'Helmet size', 'value', v_cfg ->> 'size')
    );

    foreach v_group in array array['route', 'finish', 'base', 'trim', 'spoiler']
    loop
      -- Chrome replaces the base colour, so the base colour is neither priced nor shown.
      if v_group = 'base' and v_cfg ->> 'finish' = 'chrome' then
        v_summary := v_summary || jsonb_build_object('label', v_group_labels ->> v_group, 'value', 'Chrome');
        continue;
      end if;

      select * into v_option
      from public.configurator_options
      where option_group = v_group and value = v_cfg ->> v_group and is_active;
      if not found then
        raise exception 'One of the selected options is no longer available.' using errcode = '22023';
      end if;

      v_unit := v_unit + v_option.price;
      v_summary := v_summary || jsonb_build_object('label', v_group_labels ->> v_group, 'value', v_option.label);
    end loop;

    if v_cfg ->> 'route' = 'new' then
      v_unit := v_unit + v_model.new_helmet_price;
    end if;

    v_summary := v_summary || jsonb_build_object('label', 'Hydro-dip film', 'value', v_film.name);

    -- Personalisation (optional).
    v_rider_name := btrim(coalesce(v_cfg ->> 'riderName', ''));
    v_race_number := btrim(coalesce(v_cfg ->> 'raceNumber', ''));
    v_logo := nullif(btrim(coalesce(v_cfg ->> 'logo', '')), '');
    if char_length(v_rider_name) > 24 then
      raise exception 'The name on the helmet can be up to 24 characters.' using errcode = '22023';
    end if;
    if v_race_number !~ '^[0-9A-Za-z]{0,3}$' then
      raise exception 'Race numbers can be up to 3 letters or digits.' using errcode = '22023';
    end if;
    if v_logo is not null and (
      v_logo !~ ('^' || v_user::text || '/[0-9a-f-]{36}\.(png|jpg|webp)$')
      or not exists (select 1 from storage.objects o where o.bucket_id = 'design-logos' and o.name = v_logo)
    ) then
      raise exception 'Your logo didn''t upload. Please add it again.' using errcode = '22023';
    end if;
    if v_rider_name <> '' then
      v_summary := v_summary || jsonb_build_object('label', 'Name on helmet', 'value', v_rider_name);
    end if;
    if v_race_number <> '' then
      v_summary := v_summary || jsonb_build_object('label', 'Race number', 'value', v_race_number);
    end if;
    if v_logo is not null then
      v_summary := v_summary || jsonb_build_object('label', 'Logo', 'value', 'Uploaded');
    end if;

    v_subtotal := v_subtotal + v_unit * v_qty;

    v_lines := v_lines || jsonb_build_object(
      'product_id', v_product.id,
      'slug', v_product.slug,
      'name', v_product.name,
      'configuration', jsonb_build_object('values', v_cfg, 'summary', v_summary, 'look', v_product.look),
      'unit_price', v_unit,
      'quantity', v_qty
    );
  end loop;

  insert into public.orders (
    user_id, customer_name, customer_email, customer_phone, shipping_address,
    delivery_method, delivery_label, delivery_price, subtotal, total, customer_notes
  )
  values (
    v_user,
    trim(p_customer ->> 'name'),
    lower(trim(p_customer ->> 'email')),
    coalesce(trim(p_customer ->> 'phone'), ''),
    coalesce(p_shipping, '{}'::jsonb),
    p_delivery_method,
    v_delivery ->> 'label',
    v_delivery_price,
    v_subtotal,
    v_subtotal + v_delivery_price,
    left(coalesce(p_notes, ''), 2000)
  )
  returning id, orders.order_number into v_order_id, v_order_number;

  insert into public.order_items (order_id, product_id, product_slug, product_name, configuration, unit_price, quantity, line_total)
  select
    v_order_id,
    (line.value ->> 'product_id')::uuid,
    line.value ->> 'slug',
    line.value ->> 'name',
    line.value -> 'configuration',
    (line.value ->> 'unit_price')::numeric,
    (line.value ->> 'quantity')::integer,
    (line.value ->> 'unit_price')::numeric * (line.value ->> 'quantity')::integer
  from jsonb_array_elements(v_lines) as line(value);

  insert into public.order_status_events (order_id, status, payment_status, note, created_by)
  values (v_order_id, 'pending', 'unpaid', 'Order placed', v_user);

  return query select v_order_id, v_order_number;
end;
$$;

revoke all on function public.place_order(jsonb, jsonb, jsonb, text, text) from public, anon;
grant execute on function public.place_order(jsonb, jsonb, jsonb, text, text) to authenticated;
