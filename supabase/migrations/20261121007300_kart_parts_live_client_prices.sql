-- MS Kart parts by HydroKarts: all 28 parts on the website, with the client's prices from
-- "Parts-Dipped-Price- calculator.xlsx" (21 Nov 2026). Each price is the whole job for
-- that part or set; the unit (pair, set) is in the name. Parts without a photo show a
-- plain part icon until the client adds one in Admin > Shop products.
--
-- Changes from the client's sheet: Kelgate side plates added; the two Nassau panel
-- brackets are one set; bearing housing is a set of 3 carriers; rear bumper and steel
-- pedals are paint only. Rear hubs keep their price (none given in the sheet yet).
-- The four old parts not on the list stay hidden.

-- The new part.
insert into public.shop_products (store_id, slug, title, brand, description, option_names, is_active, customisable, custom_finishes, custom_fee, sort_order)
values ('hydrokarts-parts', 'custom-kelgate-side-plates', 'Kelgate side plates (pair)', 'MS Kart',
  'Kelgate side plates (pair), finished in your own paint colour or hydro-dip film.', '{}', false, true, array['paint', 'film'], 0, 285)
on conflict do nothing;

insert into public.shop_variants (product_id, option_values, price, track_stock, allow_backorder)
select p.id, '{}'::jsonb, 0, false, true
from public.shop_products p
where p.slug = 'custom-kelgate-side-plates'
  and not exists (select 1 from public.shop_variants v where v.product_id = p.id);

-- Names, prices and finishes from the client's list. The price is the whole job, so the
-- old separate finishing fee is gone.
update public.shop_products p
set title = v.title,
    custom_finishes = case when v.paint_only then array['paint'] else array['paint', 'film'] end,
    custom_fee = 0,
    is_active = true
from (values
  ('custom-front-floor-tray', 'Front floor tray', false),
  ('custom-lower-chrome-bumper', 'Lower chrome bumper', true),
  ('custom-upper-chrome-bumper', 'Upper chrome bumper', true),
  ('custom-aluminium-pedals', 'Aluminium pedals (pair)', false),
  ('custom-steel-pedals', 'Steel pedals (pair)', true),
  ('front-stub-axle', 'Stub axles (pair)', false),
  ('custom-front-hub', 'Front hubs (pair)', false),
  ('custom-torsion-bar', 'Torsion bar', false),
  ('custom-torsion-clamps', 'Torsion clamps (pair)', false),
  ('custom-track-rods', 'Track rods (pair)', false),
  ('custom-steering-wheel', 'Steering wheel', false),
  ('custom-steering-column', 'Steering column', false),
  ('custom-steering-column-lock-ring', 'Steering column lock ring', false),
  ('custom-steering-column-sleeve', 'Steering column sleeve (aluminium)', false),
  ('custom-steering-boss', 'Steering boss (adjustable)', false),
  ('custom-seat-stays', 'Seat stays (pair)', false),
  ('custom-side-pod-holders', 'Side pod holders (set of 4)', false),
  ('custom-side-pod-bars', 'Side pod bars (pair)', true),
  ('custom-bearing-housing', 'Bearing housing carriers (set of 3)', false),
  ('sprocket-carrier', 'Sprocket carriers (pair)', false),
  ('custom-sprocket-guards', 'Sprocket guards (set of 4)', false),
  ('custom-rear-bumper', 'Rear bumper', true),
  ('custom-rims', 'Rims (2 front and 2 rear)', false),
  ('rear-wheel-hub', 'Rear hubs (pair)', false),
  ('brake-caliper', 'Kelgate caliper', false),
  ('custom-brake-disc-carrier', 'Brake disc carrier', false),
  ('custom-nassau-panel-top-bracket', 'Nassau panel top and lower brackets (set of 3)', false),
  ('custom-kelgate-side-plates', 'Kelgate side plates (pair)', false)
) as v (slug, title, paint_only)
where p.store_id = 'hydrokarts-parts' and p.slug = v.slug;

-- The drafts' descriptions follow their new names and finishes.
update public.shop_products
set description = title || ', finished in your own ' || case when custom_finishes = array['paint'] then 'paint colour.' else 'paint colour or hydro-dip film.' end
where store_id = 'hydrokarts-parts' and slug like 'custom-%' and is_active;

-- The lower bracket is part of the Nassau set now.
update public.shop_products set is_active = false where store_id = 'hydrokarts-parts' and slug = 'custom-nassau-panel-lower-bracket';

-- Prices (rear hubs keep theirs until the client gives one).
update public.shop_variants s
set price = v.price
from public.shop_products p, (values
  ('custom-front-floor-tray', 40), ('custom-lower-chrome-bumper', 35), ('custom-upper-chrome-bumper', 35),
  ('custom-aluminium-pedals', 70), ('custom-steel-pedals', 35), ('front-stub-axle', 105),
  ('custom-front-hub', 160), ('custom-torsion-bar', 70), ('custom-torsion-clamps', 80),
  ('custom-track-rods', 70), ('custom-steering-wheel', 140), ('custom-steering-column', 70),
  ('custom-steering-column-lock-ring', 35), ('custom-steering-column-sleeve', 35), ('custom-steering-boss', 70),
  ('custom-seat-stays', 120), ('custom-side-pod-holders', 40), ('custom-side-pod-bars', 70),
  ('custom-bearing-housing', 140), ('sprocket-carrier', 140), ('custom-sprocket-guards', 80),
  ('custom-rear-bumper', 70), ('custom-rims', 300), ('brake-caliper', 105),
  ('custom-brake-disc-carrier', 70), ('custom-nassau-panel-top-bracket', 105), ('custom-kelgate-side-plates', 70)
) as v (slug, price)
where s.product_id = p.id and p.store_id = 'hydrokarts-parts' and p.slug = v.slug;

-- Finished to order, so never out of stock.
update public.shop_variants s
set track_stock = false, allow_backorder = true
from public.shop_products p
where s.product_id = p.id and p.store_id = 'hydrokarts-parts' and p.customisable and p.is_active;
