-- "Crimson Bolt" (designed by Ilyas): a red helmet with black blades, white flashes and
-- brighter red zigzags. Bell KC7. The name can be changed in admin.

insert into public.products (slug, name, tagline, description, category, model_ids, base_price, badge, features, specs, look, is_active, sort_order)
values (
  'crimson-bolt', 'Crimson Bolt', 'Red with black blades and white flashes.',
  'A bold red helmet with black blades, white flashes and bright red zigzags. Change the colour of any zone, or dip it in a film.',
  'racing-lines', array['bell-kc7'], 295, 'New',
  array['Designed for the Bell KC7', 'Every colour zone can be changed', 'Names, numbers and logos can be added'],
  '[{"label":"Clear coat","value":"2K automotive lacquer, gloss or matte"},{"label":"Approval","value":"Digital proof signed off before we start"}]'::jsonb,
  -- Palette swatches, so the template opens as designed.
  '{"layout":"apex","finish":"gloss","base":"#d7261e","graphic":"#111412","accent":"#f4f3ee","film":"none","trim":"#111412","spoiler":false}'::jsonb,
  true, 14
)
on conflict (slug) do nothing;

insert into public.design_templates (product_slug, model_id, svg_url, thumbnail_url, artwork_status, is_active, sort_order)
select 'crimson-bolt', 'bell-kc7', '/models/templates/bell-kc7/crimson-bolt/artwork.webp', '/models/templates/bell-kc7/crimson-bolt/thumbnail.png', 'ready', true, 0
where not exists (select 1 from public.design_templates t where t.product_slug = 'crimson-bolt' and t.model_id = 'bell-kc7');

-- Colour zones with their share of the shell (scripts/compute-zone-coverage.mjs), then racing lines.
insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, allows_film, allows_chrome, allows_metallic, sort_order, coverage)
select t.id, zones.key, zones.label, 'fill', '/models/templates/bell-kc7/crimson-bolt/' || zones.key || '-mask.png',
  zones.colour, true, zones.key <> 'base', true, zones.sort_order, zones.coverage
from public.design_templates t
join (values
  ('base', 'Red', '#d7261e', 1, 0.6350),
  ('graphic', 'Black blades', '#111412', 2, 0.1352),
  ('accent', 'White flashes', '#f4f3ee', 3, 0.1917),
  ('detail', 'Red zigzags', '#d7261e', 4, 0.0439)
) as zones (key, label, colour, sort_order, coverage) on true
where t.product_slug = 'crimson-bolt' and t.model_id = 'bell-kc7'
on conflict (template_id, key) do nothing;

insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, allows_film, allows_chrome, allows_metallic, sort_order)
select t.id, 'lines', 'Racing lines', 'pinstripe', '/models/templates/bell-kc7/crimson-bolt/lines-mask.png', '#f4f3ee', true, false, true, 9
from public.design_templates t
where t.product_slug = 'crimson-bolt' and t.model_id = 'bell-kc7'
on conflict (template_id, key) do nothing;
