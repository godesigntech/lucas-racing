-- Hornet and Blue Arrow were drawn for the Arai SK-6 only, so on the Bell KC7 their
-- template cards showed a broken picture and "Not available on this helmet". Their
-- artwork is now moved onto the Bell's shell too (scripts/prepare-sk6-templates.mjs
-- --to-bell), so both designs work on both helmets.
--
-- Union Strike (migration 20261114005600) was added without its artwork files, so it
-- only ever showed a plain colour swatch. Hidden until its artwork is supplied.

-- 1. Offered on both helmets.
update public.products
set model_ids = array['bell-kc7', 'arai-sk6']
where slug in ('hornet', 'blue-arrow');

-- 2. A Bell copy of each SK-6 template, pointing at the Bell artwork.
insert into public.design_templates (product_slug, model_id, svg_url, thumbnail_url, artwork_status, is_active, sort_order)
select a.product_slug, 'bell-kc7',
  replace(a.svg_url, '/arai-sk6/', '/bell-kc7/'), replace(a.thumbnail_url, '/arai-sk6/', '/bell-kc7/'),
  a.artwork_status, a.is_active, a.sort_order
from public.design_templates a
where a.model_id = 'arai-sk6' and a.product_slug in ('hornet', 'blue-arrow')
  and not exists (select 1 from public.design_templates t where t.product_slug = a.product_slug and t.model_id = 'bell-kc7');

-- 3. Its colour zones and racing lines, with the Bell's masks.
insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, allows_film, allows_chrome, allows_metallic, sort_order, coverage)
select b.id, r.key, r.label, r.kind, replace(r.mask_url, '/arai-sk6/', '/bell-kc7/'), r.default_colour,
  r.allows_film, r.allows_chrome, r.allows_metallic, r.sort_order, r.coverage
from public.design_templates a
join public.template_regions r on r.template_id = a.id
join public.design_templates b on b.product_slug = a.product_slug and b.model_id = 'bell-kc7'
where a.model_id = 'arai-sk6' and a.product_slug in ('hornet', 'blue-arrow')
on conflict (template_id, key) do nothing;

-- 4. Each zone's share of the Bell's shell (dips are priced by it).
update public.template_regions r
set coverage = v.coverage
from (values
  ('hornet', 'base', 0.6326),
  ('hornet', 'graphic', 0.2526),
  ('hornet', 'accent', 0.0880),
  ('hornet', 'detail', 0.0410),
  ('blue-arrow', 'base', 0.7322),
  ('blue-arrow', 'graphic', 0.0518),
  ('blue-arrow', 'accent', 0.0537),
  ('blue-arrow', 'detail', 0.0431),
  ('blue-arrow', 'rim', 0.1223)
) as v (product_slug, key, coverage)
join public.design_templates t on t.product_slug = v.product_slug and t.model_id = 'bell-kc7'
where r.template_id = t.id and r.key = v.key;

-- 5. Union Strike hidden until its artwork arrives.
update public.products set is_active = false where slug = 'union-strike';
