-- MS Kart parts by HydroKarts: the client's list of 28 parts that can be dipped or painted
-- (18 Nov 2026). No chrome on kart parts; the two chrome bumpers and the side pod bars are
-- paint only.
--
-- The four parts already on sale that are on the list keep their prices and photos and get
-- the client's names. The four that aren't on the list are hidden (kept, not deleted). The
-- other 24 go in as hidden drafts with no price (addresses start custom-, as product
-- addresses are unique across every shop): the client adds a price and photo in
-- Admin > Shop products and switches each one on.

-- No chrome on any kart part.
update public.shop_products
set custom_finishes = array_remove(custom_finishes, 'chrome')
where store_id = 'hydrokarts-parts' and customisable;

update public.shop_products set title = 'Stub axle' where store_id = 'hydrokarts-parts' and slug = 'front-stub-axle';
update public.shop_products set title = 'Rear hub' where store_id = 'hydrokarts-parts' and slug = 'rear-wheel-hub';
update public.shop_products set title = 'Kelgate caliper' where store_id = 'hydrokarts-parts' and slug = 'brake-caliper';

update public.shop_products set is_active = false
where store_id = 'hydrokarts-parts' and slug in ('custom-brake-pedal', 'front-fairing', 'side-pods', 'steering-wheel-cover');

insert into public.shop_products (store_id, slug, title, brand, description, option_names, is_active, customisable, custom_finishes, custom_fee, sort_order)
select 'hydrokarts-parts', part.slug, part.title, 'MS Kart',
  part.title || ', finished in your own ' || case when part.paint_only then 'paint colour.' else 'paint colour or hydro-dip film.' end,
  '{}', false, true,
  case when part.paint_only then array['paint'] else array['paint', 'film'] end,
  0, part.sort_order
from (values
  ('custom-front-floor-tray', 'Front floor tray', false, 10),
  ('custom-lower-chrome-bumper', 'Lower chrome bumper', true, 20),
  ('custom-upper-chrome-bumper', 'Upper chrome bumper', true, 30),
  ('custom-aluminium-pedals', 'Aluminium pedals', false, 40),
  ('custom-steel-pedals', 'Steel pedals', false, 50),
  ('custom-front-hub', 'Front hub', false, 70),
  ('custom-torsion-bar', 'Torsion bar', false, 80),
  ('custom-torsion-clamps', 'Torsion clamps', false, 90),
  ('custom-track-rods', 'Track rods', false, 100),
  ('custom-steering-wheel', 'Steering wheel', false, 110),
  ('custom-steering-column', 'Steering column', false, 120),
  ('custom-steering-column-lock-ring', 'Steering column lock ring', false, 130),
  ('custom-steering-column-sleeve', 'Steering column sleeve (aluminium)', false, 140),
  ('custom-steering-boss', 'Steering boss (adjustable)', false, 150),
  ('custom-seat-stays', 'Seat stays', false, 160),
  ('custom-side-pod-holders', 'Side pod holders', false, 170),
  ('custom-side-pod-bars', 'Side pod bars', true, 180),
  ('custom-bearing-housing', 'Bearing housing', false, 190),
  ('custom-sprocket-guards', 'Sprocket guards', false, 210),
  ('custom-rear-bumper', 'Rear bumper', false, 220),
  ('custom-rims', 'Rims', false, 230),
  ('custom-brake-disc-carrier', 'Brake disc carrier', false, 260),
  ('custom-nassau-panel-top-bracket', 'Nassau panel top bracket', false, 270),
  ('custom-nassau-panel-lower-bracket', 'Nassau panel lower bracket', false, 280)
) as part(slug, title, paint_only, sort_order)
on conflict do nothing;

-- Each draft needs one variant for its price; 0 until the client sets it (hidden until then).
insert into public.shop_variants (product_id, option_values, price, track_stock, allow_backorder)
select product.id, '{}'::jsonb, 0, false, true
from public.shop_products product
where product.store_id = 'hydrokarts-parts' and not product.is_active and product.customisable
  and not exists (select 1 from public.shop_variants variant where variant.product_id = product.id);

-- Keep the client's order for the four that stay on sale.
update public.shop_products set sort_order = 60 where store_id = 'hydrokarts-parts' and slug = 'front-stub-axle';
update public.shop_products set sort_order = 200 where store_id = 'hydrokarts-parts' and slug = 'sprocket-carrier';
update public.shop_products set sort_order = 240 where store_id = 'hydrokarts-parts' and slug = 'rear-wheel-hub';
update public.shop_products set sort_order = 250 where store_id = 'hydrokarts-parts' and slug = 'brake-caliper';
