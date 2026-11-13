-- "Cobalt Storm": a royal blue helmet with navy blades, white and silver flashes and
-- sky blue panels. Bell KC7. The name can be changed in admin.

insert into public.products (slug, name, tagline, description, category, model_ids, base_price, badge, features, specs, look, is_active, sort_order)
values (
  'cobalt-storm', 'Cobalt Storm', 'Royal blue with navy blades and white flashes.',
  'A royal blue helmet with navy blades, white and silver flashes and sky blue panels. Change the colour of any zone, or dip it in a film.',
  'racing-lines', array['bell-kc7'], 295, 'New',
  array['Designed for the Bell KC7', 'Every colour zone can be changed', 'Names, numbers and logos can be added'],
  '[{"label":"Clear coat","value":"2K automotive lacquer, gloss or matte"},{"label":"Approval","value":"Digital proof signed off before we start"}]'::jsonb,
  -- Palette swatches, so the template opens as designed.
  '{"layout":"apex","finish":"gloss","base":"#1f3fd6","graphic":"#0b1450","accent":"#f4f3ee","film":"none","trim":"#0b1450","spoiler":false}'::jsonb,
  true, 15
)
on conflict (slug) do nothing;

insert into public.design_templates (product_slug, model_id, svg_url, thumbnail_url, artwork_status, is_active, sort_order)
select 'cobalt-storm', 'bell-kc7', '/models/templates/bell-kc7/cobalt-storm/artwork.webp', '/models/templates/bell-kc7/cobalt-storm/thumbnail.png', 'ready', true, 0
where not exists (select 1 from public.design_templates t where t.product_slug = 'cobalt-storm' and t.model_id = 'bell-kc7');

-- Colour zones with their share of the shell (from the masks), then racing lines.
insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, allows_film, allows_chrome, allows_metallic, sort_order, coverage)
select t.id, zones.key, zones.label, 'fill', '/models/templates/bell-kc7/cobalt-storm/' || zones.key || '-mask.png',
  zones.colour, true, zones.key <> 'base', true, zones.sort_order, zones.coverage
from public.design_templates t
join (values
  ('base', 'Royal blue', '#1f3fd6', 1, 0.3596),
  ('graphic', 'Navy blades', '#0b1450', 2, 0.1638),
  ('accent', 'White flashes', '#f4f3ee', 3, 0.2005),
  ('detail', 'Sky blue panels', '#2fa8ef', 4, 0.2834)
) as zones (key, label, colour, sort_order, coverage) on true
where t.product_slug = 'cobalt-storm' and t.model_id = 'bell-kc7'
on conflict (template_id, key) do nothing;

insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, allows_film, allows_chrome, allows_metallic, sort_order)
select t.id, 'lines', 'Racing lines', 'pinstripe', '/models/templates/bell-kc7/cobalt-storm/lines-mask.png', '#f4f3ee', true, false, true, 9
from public.design_templates t
where t.product_slug = 'cobalt-storm' and t.model_id = 'bell-kc7'
on conflict (template_id, key) do nothing;
