-- Lucas Racing: shop listing view (filters, sorting, search) and CSV product import.

-- ---------------------------------------------------------------------------
-- Import bookkeeping: the supplier's price, and what an admin has changed by hand
-- (an import never overwrites those).
-- ---------------------------------------------------------------------------
alter table public.shop_variants
  add column rrp numeric(10, 2) check (rrp is null or rrp >= 0),
  add column price_is_manual boolean not null default false;

alter table public.shop_products
  add column manual_fields text[] not null default '{}';

create table public.import_runs (
  id uuid primary key default gen_random_uuid(),
  store_id text not null references public.stores (id) on delete cascade,
  file_name text not null default '',
  full_catalogue boolean not null default false,
  -- {"created": 0, "updated": 0, "unchanged": 0, "hidden": 0, "failed": 0}
  counts jsonb not null default '{}',
  -- [{"row": 12, "message": "Missing price"}], first 200 only
  errors jsonb not null default '[]',
  created_by uuid,
  created_at timestamptz not null default now()
);

alter table public.import_runs enable row level security;
create policy "Admins read imports" on public.import_runs
  for select to authenticated using ((select public.is_full_admin()));
create policy "Admins log imports" on public.import_runs
  for insert to authenticated with check ((select public.is_full_admin()));

-- ---------------------------------------------------------------------------
-- One row per product with its price range and stock, for shop grids.
-- security_invoker keeps the tables' row level security in force, so visitors
-- only see active products and their active variants.
-- ---------------------------------------------------------------------------
create view public.shop_product_listing
with (security_invoker = true) as
select
  p.id,
  p.store_id,
  p.category_id,
  p.slug,
  p.title,
  p.brand,
  p.images[1] as image_url,
  p.featured,
  p.customisable,
  p.sort_order,
  p.created_at,
  p.is_active,
  min(v.price) as min_price,
  max(v.price) as max_price,
  max(v.compare_at_price) as compare_at_price,
  count(v.id)::integer as variant_count,
  -- The only variant's id, so single-option products can be added straight from the grid.
  case when count(v.id) = 1 then (array_agg(v.id))[1] end as single_variant_id,
  bool_or(not v.track_stock or v.allow_backorder or v.stock_quantity > 0) as in_stock,
  coalesce(sum(v.stock_quantity) filter (where v.track_stock), 0)::integer as stock_total,
  bool_and(v.track_stock and v.stock_quantity > 0 and v.stock_quantity <= 3) as low_stock,
  -- Part numbers, for search.
  coalesce(string_agg(v.sku, ' '), '') as skus
from public.shop_products p
join public.shop_variants v on v.product_id = p.id and v.is_active
group by p.id;

grant select on public.shop_product_listing to anon, authenticated;
