-- Lucas Racing: core schema (catalogue, settings, customers, orders).

create extension if not exists pgcrypto;

-- Shared trigger to keep updated_at current.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Site settings (single row)
-- ---------------------------------------------------------------------------
create table public.site_settings (
  id smallint primary key default 1 check (id = 1),
  business_name text not null default 'Lucas Racing',
  partner_name text not null default 'Hydro Karts',
  contact_email text not null default '',
  contact_phone text not null default '',
  location text not null default '',
  address_note text not null default '',
  opening_hours text not null default '',
  event_name text not null default '',
  event_dates text not null default '',
  show_event_banner boolean not null default true,
  -- [{ "label": "Instagram", "icon": "instagram", "href": "https://..." }]
  social_links jsonb not null default '[]'::jsonb check (jsonb_typeof(social_links) = 'array'),
  -- [{ "id": "courier", "label": "...", "description": "...", "price": 12, "active": true }]
  delivery_methods jsonb not null default '[]'::jsonb check (jsonb_typeof(delivery_methods) = 'array'),
  updated_at timestamptz not null default now()
);

create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------
create table public.helmet_models (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  brand text not null,
  name text not null,
  short_name text not null,
  summary text not null default '',
  new_helmet_price numeric(10, 2) not null default 0 check (new_helmet_price >= 0),
  sizes text[] not null default array['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger helmet_models_updated_at before update on public.helmet_models
  for each row execute function public.set_updated_at();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(trim(name)) > 0),
  tagline text not null default '',
  description text not null default '',
  category text not null check (category in ('racing-lines', 'hydro-dip', 'chrome', 'bespoke')),
  model_ids text[] not null default '{}',
  -- null means "price on request" (bespoke work).
  base_price numeric(10, 2) check (base_price is null or base_price >= 0),
  badge text check (badge in ('Launch design', 'New', 'Most popular')),
  features text[] not null default '{}',
  specs jsonb not null default '[]'::jsonb check (jsonb_typeof(specs) = 'array'),
  look jsonb not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_active_sort_idx on public.products (is_active, sort_order);

create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

create table public.films (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(trim(name)) > 0),
  category text not null default 'Other',
  -- Preview pattern used by the illustrated configurator until real film scans arrive.
  pattern text not null check (pattern in ('none', 'carbon', 'forged', 'hex', 'camo')),
  price numeric(10, 2) not null default 0 check (price >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger films_updated_at before update on public.films
  for each row execute function public.set_updated_at();

create table public.configurator_options (
  option_group text not null check (option_group in ('route', 'finish', 'base', 'trim', 'spoiler')),
  value text not null,
  label text not null,
  hint text,
  swatch text,
  price numeric(10, 2) not null default 0 check (price >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (option_group, value)
);

create trigger configurator_options_updated_at before update on public.configurator_options
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  phone text not null default '',
  address_line1 text not null default '',
  address_line2 text not null default '',
  city text not null default '',
  county text not null default '',
  postcode text not null default '',
  country text not null default 'United Kingdom',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create table public.admin_users (
  email text primary key check (email = lower(email) and position('@' in email) > 1),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create sequence public.order_number_seq start 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('LR-' || nextval('public.order_number_seq')),
  user_id uuid references auth.users (id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'in_production', 'ready', 'shipped', 'completed', 'cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid', 'refunded')),
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null default '',
  shipping_address jsonb not null default '{}'::jsonb,
  delivery_method text not null,
  delivery_label text not null,
  delivery_price numeric(10, 2) not null default 0 check (delivery_price >= 0),
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  total numeric(10, 2) not null check (total >= 0),
  customer_notes text not null default '',
  admin_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_user_created_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status);
create index orders_created_idx on public.orders (created_at desc);

create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_slug text not null,
  product_name text not null,
  -- { "values": {...}, "summary": [{ "label", "value" }], "look": {...} }
  configuration jsonb not null,
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity between 1 and 10),
  line_total numeric(10, 2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create index order_items_order_idx on public.order_items (order_id);

create table public.order_status_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  status text not null,
  payment_status text,
  note text not null default '',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index order_status_events_order_idx on public.order_status_events (order_id, created_at);
