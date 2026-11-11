-- "Yellow Flash" (designed by Ilyas): white blades and yellow strikes over the helmet's
-- base colour, black to start. Bell KC7. The name can be changed in admin.

insert into public.products (slug, name, tagline, description, category, model_ids, base_price, badge, features, specs, look, is_active, sort_order)
values (
  'yellow-flash', 'Yellow Flash', 'White blades and yellow strikes on black.',
  'Sharp white blades with yellow strikes over a black helmet. Change the colour of any zone, or dip it in a film.',
  'racing-lines', array['bell-kc7'], 295, 'New',
  array['Designed for the Bell KC7', 'Every colour zone can be changed', 'Names, numbers and logos can be added'],
  '[{"label":"Clear coat","value":"2K automotive lacquer, gloss or matte"},{"label":"Approval","value":"Digital proof signed off before we start"}]'::jsonb,
  -- Palette swatches, so the template opens as designed.
  '{"layout":"apex","finish":"gloss","base":"#111412","graphic":"#f4f3ee","accent":"#c6f432","film":"none","trim":"#111412","spoiler":false}'::jsonb,
  true, 13
)
on conflict (slug) do nothing;

insert into public.design_templates (product_slug, model_id, svg_url, thumbnail_url, artwork_status, is_active, sort_order)
select 'yellow-flash', 'bell-kc7', '/models/templates/bell-kc7/yellow-flash/artwork.webp', '/models/templates/bell-kc7/yellow-flash/thumbnail.png', 'ready', true, 0
where not exists (select 1 from public.design_templates t where t.product_slug = 'yellow-flash' and t.model_id = 'bell-kc7');

-- Colour zones with their share of the shell (scripts/compute-zone-coverage.mjs), then racing lines.
insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, allows_film, allows_chrome, allows_metallic, sort_order, coverage)
select t.id, zones.key, zones.label, 'fill', '/models/templates/bell-kc7/yellow-flash/' || zones.key || '-mask.png',
  zones.colour, true, zones.key <> 'base', true, zones.sort_order, zones.coverage
from public.design_templates t
join (values
  ('base', 'Black', '#111412', 1, 0.6554),
  ('graphic', 'White blades', '#f4f3ee', 2, 0.2427),
  ('accent', 'Yellow strikes', '#c6f432', 3, 0.1079)
) as zones (key, label, colour, sort_order, coverage) on true
where t.product_slug = 'yellow-flash' and t.model_id = 'bell-kc7'
on conflict (template_id, key) do nothing;

insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, allows_film, allows_chrome, allows_metallic, sort_order)
select t.id, 'lines', 'Racing lines', 'pinstripe', '/models/templates/bell-kc7/yellow-flash/lines-mask.png', '#f4f3ee', true, false, true, 9
from public.design_templates t
where t.product_slug = 'yellow-flash' and t.model_id = 'bell-kc7'
on conflict (template_id, key) do nothing;
