-- Lucas Racing: one product catalogue for every shop (MS Kart, Teamwear, HydroKarts
-- parts, Delta Racewear), with stock, sold through the same basket and checkout
-- as custom helmets.

-- ---------------------------------------------------------------------------
-- Stores: the shop sections. Delta is browse-only (customers order with Delta).
-- ---------------------------------------------------------------------------
create table public.stores (
  id text primary key,
  name text not null,
  description text not null default '',
  purchasable boolean not null default true,
  sort_order integer not null default 100
);

insert into public.stores (id, name, description, purchasable, sort_order) values
  ('ms-kart', 'MS Kart shop', 'Complete MS Kart karts, chassis, parts, spares and accessories.', true, 10),
  ('teamwear', 'Wendy''s Teamwear', 'Lucas Racing hoodies, sweatshirts, T-shirts, polo shirts and merchandise.', true, 20),
  ('hydrokarts-parts', 'MS Kart parts by HydroKarts', 'Selected MS Kart parts finished in your own colours.', true, 30),
  ('delta', 'Delta Racewear', 'Custom race suits, ordered directly with Delta Racewear.', false, 40);

-- ---------------------------------------------------------------------------
-- Categories: a tree per store.
-- ---------------------------------------------------------------------------
create table public.shop_categories (
  id uuid primary key default gen_random_uuid(),
  store_id text not null references public.stores (id) on delete cascade,
  parent_id uuid references public.shop_categories (id) on delete set null,
  name text not null check (char_length(name) between 1 and 80),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '',
  image_url text,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, slug)
);

create trigger shop_categories_updated_at before update on public.shop_categories
  for each row execute function public.set_updated_at();

insert into public.shop_categories (store_id, name, slug, description, sort_order) values
  ('ms-kart', 'Complete karts', 'complete-karts', 'Race-ready MS Kart chassis and complete kart packages.', 10),
  ('ms-kart', 'Parts and spares', 'parts', 'Chassis parts, components and race-day spares.', 20),
  ('teamwear', 'Hoodies and sweatshirts', 'hoodies-sweatshirts', '', 10),
  ('teamwear', 'T-shirts and polo shirts', 't-shirts-polos', '', 20),
  ('teamwear', 'Caps and accessories', 'caps-accessories', '', 30);

-- ---------------------------------------------------------------------------
-- Products and their variants (what is actually bought: size, colour, part number).
-- ---------------------------------------------------------------------------
create table public.shop_products (
  id uuid primary key default gen_random_uuid(),
  store_id text not null references public.stores (id) on delete restrict,
  category_id uuid references public.shop_categories (id) on delete set null,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 2 and 160),
  brand text not null default '',
  description text not null default '' check (char_length(description) <= 8000),
  -- [{ "label": "Weight", "value": "1.2 kg" }]
  specs jsonb not null default '[]',
  images text[] not null default '{}',
  -- e.g. {Size, Colour}: the names of the options its variants differ by.
  option_names text[] not null default '{}',
  source text not null default 'manual' check (source in ('manual', 'ms_kart_feed', 'delta_feed')),
  external_id text,
  external_url text,
  is_active boolean not null default true,
  featured boolean not null default false,
  customisable boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, slug)
);

create unique index shop_products_external_idx on public.shop_products (source, external_id) where external_id is not null;
create index shop_products_store_idx on public.shop_products (store_id, is_active, sort_order);
create index shop_products_category_idx on public.shop_products (category_id);

create trigger shop_products_updated_at before update on public.shop_products
  for each row execute function public.set_updated_at();

create table public.shop_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.shop_products (id) on delete cascade,
  sku text,
  -- {"Size": "M", "Colour": "Black"}; empty for products with one variant.
  option_values jsonb not null default '{}',
  price numeric(10, 2) not null check (price >= 0),
  compare_at_price numeric(10, 2) check (compare_at_price is null or compare_at_price >= 0),
  stock_quantity integer not null default 0,
  track_stock boolean not null default true,
  allow_backorder boolean not null default false,
  weight_grams integer check (weight_grams is null or weight_grams >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index shop_variants_sku_idx on public.shop_variants (lower(sku)) where sku is not null and sku <> '';
create index shop_variants_product_idx on public.shop_variants (product_id, sort_order);

create trigger shop_variants_updated_at before update on public.shop_variants
  for each row execute function public.set_updated_at();

-- Every stock change, with the reason, for an audit trail.
create table public.inventory_movements (
  id bigint generated always as identity primary key,
  variant_id uuid not null references public.shop_variants (id) on delete cascade,
  change integer not null,
  quantity_after integer not null,
  reason text not null check (reason in ('order', 'cancellation', 'adjustment', 'import')),
  order_id uuid references public.orders (id) on delete set null,
  note text not null default '',
  created_by uuid,
  created_at timestamptz not null default now()
);

create index inventory_movements_variant_idx on public.inventory_movements (variant_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Order lines: a helmet build (as before) or a shop product variant.
-- ---------------------------------------------------------------------------
alter table public.order_items
  add column line_kind text not null default 'helmet' check (line_kind in ('helmet', 'product')),
  add column store_id text references public.stores (id) on delete set null,
  add column shop_variant_id uuid references public.shop_variants (id) on delete set null;

create index order_items_store_idx on public.order_items (store_id);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.stores enable row level security;
alter table public.shop_categories enable row level security;
alter table public.shop_products enable row level security;
alter table public.shop_variants enable row level security;
alter table public.inventory_movements enable row level security;

create policy "Anyone can read stores" on public.stores
  for select to anon, authenticated using (true);
create policy "Admins manage stores" on public.stores
  for all to authenticated using ((select public.is_full_admin())) with check ((select public.is_full_admin()));

create policy "Anyone can read active categories" on public.shop_categories
  for select to anon, authenticated using (is_active or (select public.is_admin()));
create policy "Admins manage categories" on public.shop_categories
  for all to authenticated using ((select public.is_full_admin())) with check ((select public.is_full_admin()));

create policy "Anyone can read active products" on public.shop_products
  for select to anon, authenticated using (is_active or (select public.is_admin()));
create policy "Admins manage products" on public.shop_products
  for all to authenticated using ((select public.is_full_admin())) with check ((select public.is_full_admin()));

create policy "Anyone can read active variants" on public.shop_variants
  for select to anon, authenticated using (
    (select public.is_admin())
    or (is_active and exists (select 1 from public.shop_products p where p.id = product_id and p.is_active))
  );
create policy "Admins manage variants" on public.shop_variants
  for all to authenticated using ((select public.is_full_admin())) with check ((select public.is_full_admin()));

-- Movements are written only by the functions below.
create policy "Staff read stock movements" on public.inventory_movements
  for select to authenticated using ((select public.is_admin()));

-- Product photos: public bucket, admins upload.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "Product images: admins upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and (select public.is_full_admin()));
create policy "Product images: admins replace" on storage.objects
  for update to authenticated using (bucket_id = 'product-images' and (select public.is_full_admin()));
create policy "Product images: admins remove" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images' and (select public.is_full_admin()));

-- ---------------------------------------------------------------------------
-- Manual stock count from Admin > Shop: sets the level and logs the change.
-- ---------------------------------------------------------------------------
create or replace function public.set_variant_stock(p_variant_id uuid, p_quantity integer, p_note text default '')
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current integer;
begin
  if not public.is_full_admin() then
    raise exception 'You don''t have permission to change stock.' using errcode = '28000';
  end if;
  if p_quantity is null or p_quantity < -100000 or p_quantity > 100000 then
    raise exception 'Enter a stock level between -100,000 and 100,000.' using errcode = '22023';
  end if;

  select stock_quantity into v_current from public.shop_variants where id = p_variant_id for update;
  if not found then
    raise exception 'That product option no longer exists.' using errcode = '22023';
  end if;
  if v_current = p_quantity then
    return p_quantity;
  end if;

  update public.shop_variants set stock_quantity = p_quantity where id = p_variant_id;
  insert into public.inventory_movements (variant_id, change, quantity_after, reason, note, created_by)
  values (p_variant_id, p_quantity - v_current, p_quantity, 'adjustment', left(coalesce(p_note, ''), 500), auth.uid());
  return p_quantity;
end;
$$;

revoke all on function public.set_variant_stock(uuid, integer, text) from public, anon;
grant execute on function public.set_variant_stock(uuid, integer, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Cancelling an order puts its products back in stock (once).
-- ---------------------------------------------------------------------------
create or replace function public.restock_cancelled_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_line record;
  v_after integer;
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    for v_line in
      select oi.shop_variant_id, oi.quantity
      from public.order_items oi
      join public.shop_variants v on v.id = oi.shop_variant_id
      where oi.order_id = new.id and oi.line_kind = 'product' and v.track_stock
    loop
      update public.shop_variants set stock_quantity = stock_quantity + v_line.quantity
      where id = v_line.shop_variant_id
      returning stock_quantity into v_after;
      insert into public.inventory_movements (variant_id, change, quantity_after, reason, order_id, note, created_by)
      values (v_line.shop_variant_id, v_line.quantity, v_after, 'cancellation', new.id, 'Order ' || new.order_number || ' cancelled', auth.uid());
    end loop;
  end if;
  return new;
end;
$$;

create trigger orders_restock_on_cancel
  after update of status on public.orders
  for each row execute function public.restock_cancelled_order();

-- ---------------------------------------------------------------------------
-- Checkout: helmet builds as before, plus shop products.
--   Product line: {"kind":"product","variant_id":"…","quantity":2}
--   Price comes from the variant; stock is checked and reduced in the same
--   transaction (rows are locked), so two customers can't buy the last one.
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
  v_variant public.shop_variants;
  v_shop_product public.shop_products;
  v_store public.stores;
  v_part text;
  v_kind text;
  v_value text;
  v_part_label text;
  v_qty integer;
  v_unit numeric(10, 2);
  v_subtotal numeric(10, 2) := 0;
  v_summary jsonb;
  v_lines jsonb := '[]'::jsonb;
  v_delivery jsonb;
  v_delivery_price numeric(10, 2);
  v_order_id uuid;
  v_order_number text;
  v_text text;
  v_position text;
  v_logo text;
  v_key text;
  v_stock_after integer;
  v_part_labels constant jsonb := jsonb_build_object('base', 'Shell', 'graphic', 'Graphic', 'accent', 'Pinstripe');
  v_positions constant jsonb := jsonb_build_object(
    'sides', 'Both sides', 'left', 'Left side', 'right', 'Right side',
    'front', 'Front', 'back', 'Back', 'top', 'Top'
  );
begin
  if v_user is null then
    raise exception 'Please sign in to place an order.' using errcode = '28000';
  end if;

  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your basket is empty.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) > 50 then
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
    -- Shop products -----------------------------------------------------------
    if v_item ->> 'kind' = 'product' then
      v_qty := coalesce((v_item ->> 'quantity')::integer, 1);
      if v_qty < 1 or v_qty > 99 then
        raise exception 'Quantities must be between 1 and 99.' using errcode = '22023';
      end if;

      select * into v_variant from public.shop_variants
      where id = (v_item ->> 'variant_id')::uuid and is_active
      for update;
      if not found then
        raise exception 'An item in your basket is no longer available.' using errcode = '22023';
      end if;
      select * into v_shop_product from public.shop_products where id = v_variant.product_id and is_active;
      if not found then
        raise exception 'An item in your basket is no longer available.' using errcode = '22023';
      end if;
      select * into v_store from public.stores where id = v_shop_product.store_id;
      if not v_store.purchasable then
        raise exception '% is ordered directly with %.', v_shop_product.title, v_store.name using errcode = '22023';
      end if;

      if v_variant.track_stock and not v_variant.allow_backorder and v_variant.stock_quantity < v_qty then
        if v_variant.stock_quantity <= 0 then
          raise exception '% is out of stock.', v_shop_product.title using errcode = '22023';
        end if;
        raise exception 'Only % of % left in stock.', v_variant.stock_quantity, v_shop_product.title using errcode = '22023';
      end if;

      v_summary := '[]'::jsonb;
      for v_key in select key from jsonb_each_text(v_variant.option_values) order by key
      loop
        v_summary := v_summary || jsonb_build_object('label', v_key, 'value', v_variant.option_values ->> v_key);
      end loop;
      if coalesce(v_variant.sku, '') <> '' then
        v_summary := v_summary || jsonb_build_object('label', 'Part number', 'value', v_variant.sku);
      end if;

      v_stock_after := null;
      if v_variant.track_stock then
        update public.shop_variants set stock_quantity = stock_quantity - v_qty
        where id = v_variant.id
        returning stock_quantity into v_stock_after;
      end if;

      v_subtotal := v_subtotal + v_variant.price * v_qty;
      v_lines := v_lines || jsonb_build_object(
        'kind', 'product',
        'store_id', v_shop_product.store_id,
        'variant_id', v_variant.id,
        'stock_after', v_stock_after,
        'slug', v_shop_product.slug,
        'name', v_shop_product.title,
        'configuration', jsonb_build_object(
          'summary', v_summary,
          'image', v_shop_product.images[1],
          'store', v_shop_product.store_id
        ),
        'unit_price', v_variant.price,
        'quantity', v_qty
      );
      continue;
    end if;

    -- Helmet builds (unchanged) ---------------------------------------------------
    v_cfg := v_item -> 'config';
    v_qty := coalesce((v_item ->> 'quantity')::integer, 1);
    if v_qty < 1 or v_qty > 10 then
      raise exception 'Quantities must be between 1 and 10.' using errcode = '22023';
    end if;

    -- The template is the design (product).
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

    -- Helmets are always supplied new.
    v_unit := v_product.base_price + v_model.new_helmet_price;
    v_summary := jsonb_build_array(
      jsonb_build_object('label', 'Helmet', 'value', v_model.name || ' (new)'),
      jsonb_build_object('label', 'Helmet size', 'value', v_cfg ->> 'size'),
      jsonb_build_object('label', 'Template', 'value', v_product.name)
    );

    -- Parts: shell is required; graphic and pinstripe are optional (plain templates have none).
    foreach v_part in array array['base', 'graphic', 'accent']
    loop
      v_kind := v_cfg ->> (v_part || 'Kind');
      v_value := v_cfg ->> v_part;
      v_part_label := v_part_labels ->> v_part;
      if v_kind is null then
        if v_part = 'base' then
          raise exception 'Choose a colour or film for the shell.' using errcode = '22023';
        end if;
        continue;
      end if;

      if v_kind = 'colour' then
        select * into v_option from public.configurator_options
        where option_group = 'base' and value = v_value and is_active;
        if not found then
          raise exception 'One of the colours you chose is no longer available.' using errcode = '22023';
        end if;
        v_unit := v_unit + v_option.price;
        v_summary := v_summary || jsonb_build_object('label', v_part_label, 'value', v_option.label);
      elsif v_kind = 'film' then
        select * into v_film from public.films where id = v_value and is_active and texture_url is not null;
        if not found then
          raise exception 'One of the hydro-dip films you chose is no longer available.' using errcode = '22023';
        end if;
        v_unit := v_unit + v_film.price;
        v_summary := v_summary || jsonb_build_object('label', v_part_label, 'value', 'Film ' || v_film.name);
      elsif v_kind = 'chrome' and v_part = 'base' then
        select * into v_option from public.configurator_options
        where option_group = 'material' and value = 'chrome' and is_active;
        if not found then
          raise exception 'Chrome isn''t available at the moment.' using errcode = '22023';
        end if;
        v_unit := v_unit + v_option.price;
        v_summary := v_summary || jsonb_build_object('label', v_part_label, 'value', v_option.label);
      else
        raise exception 'One of the helmet parts isn''t set up correctly.' using errcode = '22023';
      end if;
    end loop;

    -- Finish, trim and spoiler come from the price list.
    select * into v_option from public.configurator_options where option_group = 'finish' and value = v_cfg ->> 'finish' and is_active;
    if not found then
      raise exception 'Please choose a finish.' using errcode = '22023';
    end if;
    v_unit := v_unit + v_option.price;
    v_summary := v_summary || jsonb_build_object('label', 'Finish', 'value', v_option.label);

    select * into v_option from public.configurator_options where option_group = 'trim' and value = v_cfg ->> 'trim' and is_active;
    if not found then
      raise exception 'Please choose a rubber trim colour.' using errcode = '22023';
    end if;
    v_unit := v_unit + v_option.price;
    v_summary := v_summary || jsonb_build_object('label', 'Rubber trim', 'value', v_option.label);

    select * into v_option from public.configurator_options where option_group = 'spoiler' and value = v_cfg ->> 'spoiler' and is_active;
    if not found then
      raise exception 'Please choose whether you''d like a spoiler.' using errcode = '22023';
    end if;
    v_unit := v_unit + v_option.price;
    v_summary := v_summary || jsonb_build_object('label', 'Rear spoiler', 'value', v_option.label);

    -- Name, race number and logo, each with a position.
    v_text := btrim(coalesce(v_cfg ->> 'riderName', ''));
    if char_length(v_text) > 24 then
      raise exception 'The name on the helmet can be up to 24 characters.' using errcode = '22023';
    end if;
    if v_text <> '' then
      v_position := coalesce(v_positions ->> (v_cfg ->> 'namePosition'), 'Both sides');
      v_summary := v_summary || jsonb_build_object('label', 'Name on helmet', 'value', v_text || ' · ' || v_position);
    end if;

    v_text := btrim(coalesce(v_cfg ->> 'raceNumber', ''));
    if v_text !~ '^[0-9A-Za-z]{0,3}$' then
      raise exception 'Race numbers can be up to 3 letters or digits.' using errcode = '22023';
    end if;
    if v_text <> '' then
      v_position := coalesce(v_positions ->> (v_cfg ->> 'numberPosition'), 'Both sides');
      v_summary := v_summary || jsonb_build_object('label', 'Race number', 'value', v_text || ' · ' || v_position);
    end if;

    v_logo := nullif(btrim(coalesce(v_cfg ->> 'logo', '')), '');
    if v_logo is not null then
      if v_logo !~ ('^' || v_user::text || '/[0-9a-f-]{36}\.(png|jpg|webp)$')
         or not exists (select 1 from storage.objects o where o.bucket_id = 'design-logos' and o.name = v_logo) then
        raise exception 'Your logo didn''t upload. Please add it again.' using errcode = '22023';
      end if;
      v_position := coalesce(v_positions ->> (v_cfg ->> 'logoPosition'), 'Back');
      v_summary := v_summary || jsonb_build_object('label', 'Logo', 'value', 'Uploaded · ' || v_position);
    end if;

    v_subtotal := v_subtotal + v_unit * v_qty;

    v_lines := v_lines || jsonb_build_object(
      'kind', 'helmet',
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

  insert into public.order_items (
    order_id, line_kind, store_id, product_id, shop_variant_id, product_slug, product_name,
    configuration, unit_price, quantity, line_total
  )
  select
    v_order_id,
    line.value ->> 'kind',
    line.value ->> 'store_id',
    (line.value ->> 'product_id')::uuid,
    (line.value ->> 'variant_id')::uuid,
    line.value ->> 'slug',
    line.value ->> 'name',
    line.value -> 'configuration',
    (line.value ->> 'unit_price')::numeric,
    (line.value ->> 'quantity')::integer,
    (line.value ->> 'unit_price')::numeric * (line.value ->> 'quantity')::integer
  from jsonb_array_elements(v_lines) as line(value);

  -- Stock audit trail for the products just sold.
  insert into public.inventory_movements (variant_id, change, quantity_after, reason, order_id, note, created_by)
  select
    (line.value ->> 'variant_id')::uuid,
    -((line.value ->> 'quantity')::integer),
    (line.value ->> 'stock_after')::integer,
    'order',
    v_order_id,
    'Order ' || v_order_number,
    v_user
  from jsonb_array_elements(v_lines) as line(value)
  where line.value ->> 'kind' = 'product' and line.value ->> 'stock_after' is not null;

  insert into public.order_status_events (order_id, status, payment_status, note, created_by)
  values (v_order_id, 'pending', 'unpaid', 'Order placed', v_user);

  return query select v_order_id, v_order_number;
end;
$$;

revoke all on function public.place_order(jsonb, jsonb, jsonb, text, text) from public, anon;
grant execute on function public.place_order(jsonb, jsonb, jsonb, text, text) to authenticated;
