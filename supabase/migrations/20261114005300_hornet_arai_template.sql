-- "Hornet": drawn for the Arai SK-6 on its own UV sheet (scripts/assets/araisk6.svg).
-- Black helmet with yellow blades, white flashes and grey streaks. Arai SK-6 only.
-- Defaults are palette swatches, so the template opens showing the artwork as drawn.
-- The name can be changed in admin.

insert into public.products (slug, name, tagline, description, category, model_ids, base_price, badge, features, specs, look, is_active, sort_order)
values (
  'hornet', 'Hornet', 'Black with yellow blades and white flashes.',
  'A black helmet with sharp yellow blades, white flashes and grey streaks, drawn for the Arai SK-6. Change the colour of any zone, or dip it in a film.',
  'racing-lines', array['arai-sk6'], 295, 'New',
  array['Designed for the Arai SK-6', 'Every colour zone can be changed', 'Names, numbers and logos can be added'],
  '[{"label":"Clear coat","value":"2K automotive lacquer, gloss or matte"},{"label":"Approval","value":"Digital proof signed off before we start"}]'::jsonb,
  '{"layout":"apex","finish":"gloss","base":"#111412","graphic":"#ffd000","accent":"#f4f3ee","film":"none","trim":"#111412","spoiler":false}'::jsonb,
  true, 16
)
on conflict (slug) do nothing;

insert into public.design_templates (product_slug, model_id, svg_url, thumbnail_url, artwork_status, is_active, sort_order)
select 'hornet', 'arai-sk6', '/models/templates/arai-sk6/hornet/artwork.webp', '/models/templates/arai-sk6/hornet/thumbnail.png', 'ready', true, 0
where not exists (select 1 from public.design_templates t where t.product_slug = 'hornet' and t.model_id = 'arai-sk6');

-- Colour zones with their share of the shell (from the masks), then racing lines.
insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, allows_film, allows_chrome, allows_metallic, sort_order, coverage)
select t.id, zones.key, zones.label, 'fill', '/models/templates/arai-sk6/hornet/' || zones.key || '-mask.png',
  zones.colour, true, zones.key <> 'base', true, zones.sort_order, zones.coverage
from public.design_templates t
join (values
  ('base', 'Black', '#111412', 1, 0.6566),
  ('graphic', 'Yellow blades', '#ffd000', 2, 0.2341),
  ('accent', 'White flashes', '#f4f3ee', 3, 0.0746),
  ('detail', 'Grey streaks', '#c4c7c9', 4, 0.0365)
) as zones (key, label, colour, sort_order, coverage) on true
where t.product_slug = 'hornet' and t.model_id = 'arai-sk6'
on conflict (template_id, key) do nothing;

insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, allows_film, allows_chrome, allows_metallic, sort_order)
select t.id, 'lines', 'Racing lines', 'pinstripe', '/models/templates/arai-sk6/hornet/lines-mask.png', '#f4f3ee', true, false, true, 9
from public.design_templates t
where t.product_slug = 'hornet' and t.model_id = 'arai-sk6'
on conflict (template_id, key) do nothing;
