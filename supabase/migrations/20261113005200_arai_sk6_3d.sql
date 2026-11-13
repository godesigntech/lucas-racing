-- Arai SK-6 in 3D (public/models/arai-sk6.glb, scripts/prepare-arai-sk6.mjs).
-- Every Bell KC7 template now works on the SK-6 too: its artwork and colour zones were
-- moved onto the SK-6's shell by scripts/prepare-sk6-templates.mjs.

-- 1. The templates are offered on both helmets.
update public.products
set model_ids = array['bell-kc7', 'arai-sk6']
where slug in ('emilio', 'nygel', 'rusinov', 'pink-blade', 'navy-pink', 'ivory-gold', 'neon-volt', 'tricolore',
  'inferno', 'strike-red', 'red-fury', 'sky-racer', 'gold-line', 'yellow-flash', 'crimson-bolt');

-- 2. An SK-6 copy of each Bell template, pointing at the SK-6 artwork.
insert into public.design_templates (product_slug, model_id, svg_url, thumbnail_url, artwork_status, is_active, sort_order)
select b.product_slug, 'arai-sk6',
  replace(b.svg_url, '/bell-kc7/', '/arai-sk6/'), replace(b.thumbnail_url, '/bell-kc7/', '/arai-sk6/'),
  b.artwork_status, b.is_active, b.sort_order
from public.design_templates b
where b.model_id = 'bell-kc7' and b.svg_url like '/models/templates/bell-kc7/%'
  and not exists (select 1 from public.design_templates t where t.product_slug = b.product_slug and t.model_id = 'arai-sk6');

-- 3. Its colour zones and racing lines, with the SK-6's masks.
insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, allows_film, allows_chrome, allows_metallic, sort_order, coverage)
select s.id, r.key, r.label, r.kind, replace(r.mask_url, '/bell-kc7/', '/arai-sk6/'), r.default_colour,
  r.allows_film, r.allows_chrome, r.allows_metallic, r.sort_order, r.coverage
from public.design_templates b
join public.template_regions r on r.template_id = b.id
join public.design_templates s on s.product_slug = b.product_slug and s.model_id = 'arai-sk6'
where b.model_id = 'bell-kc7' and r.mask_url like '/models/templates/bell-kc7/%'
on conflict (template_id, key) do nothing;

-- 4. Each zone's share of the shell, measured on each helmet's own masks (dips are priced
--    by it). Also refreshes the Bell's, since templates 1-10 were redrawn.
update public.template_regions r
set coverage = v.coverage
from (values
  ('bell-kc7', 'emilio', 'base', 0.5628),
  ('bell-kc7', 'emilio', 'graphic', 0.3462),
  ('bell-kc7', 'emilio', 'accent', 0.0331),
  ('bell-kc7', 'emilio', 'detail', 0.0707),
  ('bell-kc7', 'nygel', 'base', 0.5338),
  ('bell-kc7', 'nygel', 'graphic', 0.2050),
  ('bell-kc7', 'nygel', 'accent', 0.2715),
  ('bell-kc7', 'rusinov', 'base', 0.4599),
  ('bell-kc7', 'rusinov', 'graphic', 0.2965),
  ('bell-kc7', 'rusinov', 'accent', 0.2518),
  ('bell-kc7', 'pink-blade', 'base', 0.2791),
  ('bell-kc7', 'pink-blade', 'graphic', 0.3498),
  ('bell-kc7', 'pink-blade', 'accent', 0.3791),
  ('bell-kc7', 'navy-pink', 'base', 0.3937),
  ('bell-kc7', 'navy-pink', 'graphic', 0.2144),
  ('bell-kc7', 'navy-pink', 'accent', 0.3990),
  ('bell-kc7', 'ivory-gold', 'base', 0.7544),
  ('bell-kc7', 'ivory-gold', 'graphic', 0.1378),
  ('bell-kc7', 'ivory-gold', 'accent', 0.1223),
  ('bell-kc7', 'neon-volt', 'base', 0.4815),
  ('bell-kc7', 'neon-volt', 'graphic', 0.3085),
  ('bell-kc7', 'neon-volt', 'accent', 0.2153),
  ('bell-kc7', 'tricolore', 'base', 0.4338),
  ('bell-kc7', 'tricolore', 'graphic', 0.3170),
  ('bell-kc7', 'tricolore', 'accent', 0.2561),
  ('bell-kc7', 'inferno', 'base', 0.6867),
  ('bell-kc7', 'inferno', 'graphic', 0.2298),
  ('bell-kc7', 'inferno', 'accent', 0.0889),
  ('bell-kc7', 'strike-red', 'base', 0.5325),
  ('bell-kc7', 'strike-red', 'graphic', 0.2137),
  ('bell-kc7', 'strike-red', 'accent', 0.2590),
  ('bell-kc7', 'red-fury', 'base', 0.4060),
  ('bell-kc7', 'red-fury', 'graphic', 0.4785),
  ('bell-kc7', 'red-fury', 'accent', 0.1236),
  ('bell-kc7', 'sky-racer', 'base', 0.5130),
  ('bell-kc7', 'sky-racer', 'graphic', 0.1423),
  ('bell-kc7', 'sky-racer', 'accent', 0.3502),
  ('bell-kc7', 'gold-line', 'base', 0.6426),
  ('bell-kc7', 'gold-line', 'graphic', 0.2717),
  ('bell-kc7', 'gold-line', 'accent', 0.0947),
  ('bell-kc7', 'yellow-flash', 'base', 0.6554),
  ('bell-kc7', 'yellow-flash', 'graphic', 0.2427),
  ('bell-kc7', 'yellow-flash', 'accent', 0.1079),
  ('bell-kc7', 'crimson-bolt', 'base', 0.6350),
  ('bell-kc7', 'crimson-bolt', 'graphic', 0.1352),
  ('bell-kc7', 'crimson-bolt', 'accent', 0.1917),
  ('bell-kc7', 'crimson-bolt', 'detail', 0.0439),
  ('arai-sk6', 'emilio', 'base', 0.5168),
  ('arai-sk6', 'emilio', 'graphic', 0.3613),
  ('arai-sk6', 'emilio', 'accent', 0.0322),
  ('arai-sk6', 'emilio', 'detail', 0.1119),
  ('arai-sk6', 'nygel', 'base', 0.5193),
  ('arai-sk6', 'nygel', 'graphic', 0.2104),
  ('arai-sk6', 'nygel', 'accent', 0.2863),
  ('arai-sk6', 'rusinov', 'base', 0.4314),
  ('arai-sk6', 'rusinov', 'graphic', 0.3154),
  ('arai-sk6', 'rusinov', 'accent', 0.2657),
  ('arai-sk6', 'pink-blade', 'base', 0.2956),
  ('arai-sk6', 'pink-blade', 'graphic', 0.3375),
  ('arai-sk6', 'pink-blade', 'accent', 0.3788),
  ('arai-sk6', 'navy-pink', 'base', 0.3980),
  ('arai-sk6', 'navy-pink', 'graphic', 0.2141),
  ('arai-sk6', 'navy-pink', 'accent', 0.3985),
  ('arai-sk6', 'ivory-gold', 'base', 0.7568),
  ('arai-sk6', 'ivory-gold', 'graphic', 0.1365),
  ('arai-sk6', 'ivory-gold', 'accent', 0.1293),
  ('arai-sk6', 'neon-volt', 'base', 0.4724),
  ('arai-sk6', 'neon-volt', 'graphic', 0.3337),
  ('arai-sk6', 'neon-volt', 'accent', 0.2022),
  ('arai-sk6', 'tricolore', 'base', 0.4570),
  ('arai-sk6', 'tricolore', 'graphic', 0.3087),
  ('arai-sk6', 'tricolore', 'accent', 0.2442),
  ('arai-sk6', 'inferno', 'base', 0.6686),
  ('arai-sk6', 'inferno', 'graphic', 0.2369),
  ('arai-sk6', 'inferno', 'accent', 0.1035),
  ('arai-sk6', 'strike-red', 'base', 0.5485),
  ('arai-sk6', 'strike-red', 'graphic', 0.2274),
  ('arai-sk6', 'strike-red', 'accent', 0.2316),
  ('arai-sk6', 'red-fury', 'base', 0.4483),
  ('arai-sk6', 'red-fury', 'graphic', 0.4416),
  ('arai-sk6', 'red-fury', 'accent', 0.1228),
  ('arai-sk6', 'sky-racer', 'base', 0.5285),
  ('arai-sk6', 'sky-racer', 'graphic', 0.1316),
  ('arai-sk6', 'sky-racer', 'accent', 0.3486),
  ('arai-sk6', 'gold-line', 'base', 0.6416),
  ('arai-sk6', 'gold-line', 'graphic', 0.2697),
  ('arai-sk6', 'gold-line', 'accent', 0.1020),
  ('arai-sk6', 'yellow-flash', 'base', 0.4809),
  ('arai-sk6', 'yellow-flash', 'graphic', 0.3724),
  ('arai-sk6', 'yellow-flash', 'accent', 0.1587),
  ('arai-sk6', 'crimson-bolt', 'base', 0.6353),
  ('arai-sk6', 'crimson-bolt', 'graphic', 0.1188),
  ('arai-sk6', 'crimson-bolt', 'accent', 0.2144),
  ('arai-sk6', 'crimson-bolt', 'detail', 0.0398)

) as v (model_id, product_slug, key, coverage)
join public.design_templates t on t.product_slug = v.product_slug and t.model_id = v.model_id
where r.template_id = t.id and r.key = v.key;

-- 5. The SK-6's spoilers, priced like the Bell's.
insert into public.aero_kits (id, model_id, name, summary, mesh_name, price, is_active, sort_order) values
  ('arai-sk6-rear-spoiler', 'arai-sk6', 'Rear spoiler', 'Clear aero wing across the back of the helmet.', 'Spoiler_Rear', 45, true, 2),
  ('arai-sk6-top-spoiler', 'arai-sk6', 'Top spoiler', 'Clear aero panels across the top of the helmet.', 'Spoiler_Top', 45, true, 3),
  ('arai-sk6-chin-spoiler', 'arai-sk6', 'Chin spoiler', 'Clear aero lip under the chin vent.', 'Spoiler_Chin', 45, true, 4)
on conflict (id) do nothing;
