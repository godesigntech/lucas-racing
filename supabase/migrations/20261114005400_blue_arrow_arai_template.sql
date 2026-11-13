-- "Blue Arrow": second design drawn for the Arai SK-6 on its own outline
-- (scripts/assets/araisk6-blue-arrow.svg). Steel blue shell, yellow and white blades,
-- dark pivot recesses and orange rim strips. Arai SK-6 only.
-- Defaults are palette swatches, so the template opens showing the artwork as drawn.
-- The name can be changed in admin.

insert into public.products (slug, name, tagline, description, category, model_ids, base_price, badge, features, specs, look, is_active, sort_order)
values (
  'blue-arrow', 'Blue Arrow', 'Blue with yellow and white blades and orange rims.',
  'A blue helmet with sweeping yellow and white blades and an orange lower rim, drawn for the Arai SK-6. Change the colour of any zone, or dip it in a film.',
  'racing-lines', array['arai-sk6'], 295, 'New',
  array['Designed for the Arai SK-6', 'Every colour zone can be changed', 'Names, numbers and logos can be added'],
  '[{"label":"Clear coat","value":"2K automotive lacquer, gloss or matte"},{"label":"Approval","value":"Digital proof signed off before we start"}]'::jsonb,
  '{"layout":"apex","finish":"gloss","base":"#1f5bd8","graphic":"#ffd000","accent":"#f4f3ee","film":"none","trim":"#111412","spoiler":false}'::jsonb,
  true, 17
)
on conflict (slug) do nothing;

insert into public.design_templates (product_slug, model_id, svg_url, thumbnail_url, artwork_status, is_active, sort_order)
select 'blue-arrow', 'arai-sk6', '/models/templates/arai-sk6/blue-arrow/artwork.webp', '/models/templates/arai-sk6/blue-arrow/thumbnail.png', 'ready', true, 0
where not exists (select 1 from public.design_templates t where t.product_slug = 'blue-arrow' and t.model_id = 'arai-sk6');

-- Colour zones with their share of the shell (from the masks), then racing lines.
insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, allows_film, allows_chrome, allows_metallic, sort_order, coverage)
select t.id, zones.key, zones.label, 'fill', '/models/templates/arai-sk6/blue-arrow/' || zones.key || '-mask.png',
  zones.colour, true, zones.key <> 'base', true, zones.sort_order, zones.coverage
from public.design_templates t
join (values
  ('base', 'Blue', '#1f5bd8', 1, 0.6589),
  ('graphic', 'Yellow blades', '#ffd000', 2, 0.0441),
  ('accent', 'White blades', '#f4f3ee', 3, 0.0446),
  ('detail', 'Pivot recesses', '#4a4f55', 4, 0.0456),
  ('rim', 'Lower rim', '#ff6a13', 5, 0.2072)
) as zones (key, label, colour, sort_order, coverage) on true
where t.product_slug = 'blue-arrow' and t.model_id = 'arai-sk6'
on conflict (template_id, key) do nothing;

insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, allows_film, allows_chrome, allows_metallic, sort_order)
select t.id, 'lines', 'Racing lines', 'pinstripe', '/models/templates/arai-sk6/blue-arrow/lines-mask.png', '#f4f3ee', true, false, true, 9
from public.design_templates t
where t.product_slug = 'blue-arrow' and t.model_id = 'arai-sk6'
on conflict (template_id, key) do nothing;
