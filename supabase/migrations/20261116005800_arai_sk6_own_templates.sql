-- Ten templates drawn for the Arai SK-6 (scripts/prepare-sk6-artwork.mjs). From now on each
-- helmet has its own designs, as the client asked: the existing templates are for the
-- Bell KC7 only, and these ten for the Arai SK-6 only.

-- 1. Existing templates: Bell KC7 only. Their SK-6 copies (migration 20261113005200 and
--    20261116005700) are switched off.
update public.products set model_ids = array['bell-kc7']
where 'bell-kc7' = any (model_ids) and slug not in ('navy-lime', 'electric-blue', 'red-silver', 'red-yellow', 'blue-current', 'crimson-apex', 'jade-circuit', 'magenta-vector', 'amber-vortex', 'arctic-spear');
update public.design_templates set is_active = false where model_id = 'arai-sk6';

-- 2. The ten SK-6 designs.
insert into public.products (slug, name, tagline, description, category, model_ids, base_price, badge, features, specs, look, is_active, sort_order)
values (
  'navy-lime', 'Navy and Lime', 'White with blue and black.',
  'A karting design drawn for the Arai SK-6. Change the colour of any zone, or dip it in a film.',
  'racing-lines', array['arai-sk6'], 295, 'New',
  array['Designed for the Arai SK-6', 'Every colour zone can be changed', 'Names, numbers and logos can be added'],
  '[{"label":"Clear coat","value":"2K automotive lacquer, gloss or matte"},{"label":"Approval","value":"Digital proof signed off before we start"}]'::jsonb,
  '{"layout":"apex","finish":"gloss","base":"#f4f3ee","graphic":"#14254d","accent":"#4a4f55","film":"none","trim":"#111412","spoiler":false}'::jsonb,
  true, 100
)
on conflict (slug) do nothing;

insert into public.design_templates (product_slug, model_id, svg_url, thumbnail_url, artwork_status, is_active, sort_order)
select 'navy-lime', 'arai-sk6', '/models/templates/arai-sk6/navy-lime/artwork.webp', '/models/templates/arai-sk6/navy-lime/thumbnail.png', 'ready', true, 0
where not exists (select 1 from public.design_templates t where t.product_slug = 'navy-lime' and t.model_id = 'arai-sk6');

insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, allows_film, allows_chrome, allows_metallic, sort_order, coverage)
select t.id, zones.key, zones.label, 'fill', '/models/templates/arai-sk6/navy-lime/' || zones.key || '-mask.png', zones.colour, true, zones.key <> 'base', true, zones.sort_order, zones.coverage
from public.design_templates t
join (values
  ('base', 'White', '#f4f3ee', 1, 0.4475),
  ('graphic', 'Blue', '#14254d', 2, 0.2714),
  ('accent', 'Black', '#4a4f55', 3, 0.1778),
  ('detail', 'Yellow', '#c6f432', 4, 0.1033)
) as zones (key, label, colour, sort_order, coverage) on true
where t.product_slug = 'navy-lime' and t.model_id = 'arai-sk6'
on conflict (template_id, key) do nothing;

insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, allows_film, allows_chrome, allows_metallic, sort_order)
select t.id, 'lines', 'Racing lines', 'pinstripe', '/models/templates/arai-sk6/navy-lime/lines-mask.png', '#4a4f55', true, false, true, 9
from public.design_templates t
where t.product_slug = 'navy-lime' and t.model_id = 'arai-sk6'
on conflict (template_id, key) do nothing;

insert into public.products (slug, name, tagline, description, category, model_ids, base_price, badge, features, specs, look, is_active, sort_order)
values (
  'electric-blue', 'Electric Blue', 'Navy with blue and white.',
  'A karting design drawn for the Arai SK-6. Change the colour of any zone, or dip it in a film.',
  'racing-lines', array['arai-sk6'], 295, 'New',
  array['Designed for the Arai SK-6', 'Every colour zone can be changed', 'Names, numbers and logos can be added'],
  '[{"label":"Clear coat","value":"2K automotive lacquer, gloss or matte"},{"label":"Approval","value":"Digital proof signed off before we start"}]'::jsonb,
  '{"layout":"apex","finish":"gloss","base":"#14254d","graphic":"#1f5bd8","accent":"#f4f3ee","film":"none","trim":"#111412","spoiler":false}'::jsonb,
  true, 101
)
on conflict (slug) do nothing;

insert into public.design_templates (product_slug, model_id, svg_url, thumbnail_url, artwork_status, is_active, sort_order)
select 'electric-blue', 'arai-sk6', '/models/templates/arai-sk6/electric-blue/artwork.webp', '/models/templates/arai-sk6/electric-blue/thumbnail.png', 'ready', true, 0
where not exists (select 1 from public.design_templates t where t.product_slug = 'electric-blue' and t.model_id = 'arai-sk6');

insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, allows_film, allows_chrome, allows_metallic, sort_order, coverage)
select t.id, zones.key, zones.label, 'fill', '/models/templates/arai-sk6/electric-blue/' || zones.key || '-mask.png', zones.colour, true, zones.key <> 'base', true, zones.sort_order, zones.coverage
from public.design_templates t
join (values
  ('base', 'Navy', '#14254d', 1, 0.2897),
  ('graphic', 'Blue', '#1f5bd8', 2, 0.4322),
  ('accent', 'White', '#f4f3ee', 3, 0.2170),
  ('detail', 'Blue 2', '#6a3fb5', 4, 0.0439),
  ('rim', 'Navy 2', '#14254d', 5, 0.0172)
) as zones (key, label, colour, sort_order, coverage) on true
where t.product_slug = 'electric-blue' and t.model_id = 'arai-sk6'
on conflict (template_id, key) do nothing;

insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, allows_film, allows_chrome, allows_metallic, sort_order)
select t.id, 'lines', 'Racing lines', 'pinstripe', '/models/templates/arai-sk6/electric-blue/lines-mask.png', '#f4f3ee', true, false, true, 9
from public.design_templates t
where t.product_slug = 'electric-blue' and t.model_id = 'arai-sk6'
on conflict (template_id, key) do nothing;

insert into public.products (slug, name, tagline, description, category, model_ids, base_price, badge, features, specs, look, is_active, sort_order)
values (
  'red-silver', 'Red and Silver', 'White with grey and red.',
  'A karting design drawn for the Arai SK-6. Change the colour of any zone, or dip it in a film.',
  'racing-lines', array['arai-sk6'], 295, 'New',
  array['Designed for the Arai SK-6', 'Every colour zone can be changed', 'Names, numbers and logos can be added'],
  '[{"label":"Clear coat","value":"2K automotive lacquer, gloss or matte"},{"label":"Approval","value":"Digital proof signed off before we start"}]'::jsonb,
  '{"layout":"apex","finish":"gloss","base":"#f4f3ee","graphic":"#4a4f55","accent":"#d7261e","film":"none","trim":"#111412","spoiler":false}'::jsonb,
  true, 102
)
on conflict (slug) do nothing;

insert into public.design_templates (product_slug, model_id, svg_url, thumbnail_url, artwork_status, is_active, sort_order)
select 'red-silver', 'arai-sk6', '/models/templates/arai-sk6/red-silver/artwork.webp', '/models/templates/arai-sk6/red-silver/thumbnail.png', 'ready', true, 0
where not exists (select 1 from public.design_templates t where t.product_slug = 'red-silver' and t.model_id = 'arai-sk6');

insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, allows_film, allows_chrome, allows_metallic, sort_order, coverage)
select t.id, zones.key, zones.label, 'fill', '/models/templates/arai-sk6/red-silver/' || zones.key || '-mask.png', zones.colour, true, zones.key <> 'base', true, zones.sort_order, zones.coverage
from public.design_templates t
join (values
  ('base', 'White', '#f4f3ee', 1, 0.3260),
  ('graphic', 'Grey', '#4a4f55', 2, 0.3010),
  ('accent', 'Red', '#d7261e', 3, 0.2462),
  ('detail', 'Silver', '#c4c7c9', 4, 0.1268)
) as zones (key, label, colour, sort_order, coverage) on true
where t.product_slug = 'red-silver' and t.model_id = 'arai-sk6'
on conflict (template_id, key) do nothing;

insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, allows_film, allows_chrome, allows_metallic, sort_order)
select t.id, 'lines', 'Racing lines', 'pinstripe', '/models/templates/arai-sk6/red-silver/lines-mask.png', '#d7261e', true, false, true, 9
from public.design_templates t
where t.product_slug = 'red-silver' and t.model_id = 'arai-sk6'
on conflict (template_id, key) do nothing;

insert into public.products (slug, name, tagline, description, category, model_ids, base_price, badge, features, specs, look, is_active, sort_order)
values (
  'red-yellow', 'Red and Yellow', 'Black with yellow and red.',
  'A karting design drawn for the Arai SK-6. Change the colour of any zone, or dip it in a film.',
  'racing-lines', array['arai-sk6'], 295, 'New',
  array['Designed for the Arai SK-6', 'Every colour zone can be changed', 'Names, numbers and logos can be added'],
  '[{"label":"Clear coat","value":"2K automotive lacquer, gloss or matte"},{"label":"Approval","value":"Digital proof signed off before we start"}]'::jsonb,
  '{"layout":"apex","finish":"gloss","base":"#4a4f55","graphic":"#ffd000","accent":"#d7261e","film":"none","trim":"#111412","spoiler":false}'::jsonb,
  true, 103
)
on conflict (slug) do nothing;

insert into public.design_templates (product_slug, model_id, svg_url, thumbnail_url, artwork_status, is_active, sort_order)
select 'red-yellow', 'arai-sk6', '/models/templates/arai-sk6/red-yellow/artwork.webp', '/models/templates/arai-sk6/red-yellow/thumbnail.png', 'ready', true, 0
where not exists (select 1 from public.design_templates t where t.product_slug = 'red-yellow' and t.model_id = 'arai-sk6');

insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, allows_film, allows_chrome, allows_metallic, sort_order, coverage)
select t.id, zones.key, zones.label, 'fill', '/models/templates/arai-sk6/red-yellow/' || zones.key || '-mask.png', zones.colour, true, zones.key <> 'base', true, zones.sort_order, zones.coverage
from public.design_templates t
join (values
  ('base', 'Black', '#4a4f55', 1, 0.5171),
  ('graphic', 'Yellow', '#ffd000', 2, 0.3201),
  ('accent', 'Red', '#d7261e', 3, 0.1581),
  ('detail', 'Cream', '#c9a227', 4, 0.0047)
) as zones (key, label, colour, sort_order, coverage) on true
where t.product_slug = 'red-yellow' and t.model_id = 'arai-sk6'
on conflict (template_id, key) do nothing;

insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, allows_film, allows_chrome, allows_metallic, sort_order)
select t.id, 'lines', 'Racing lines', 'pinstripe', '/models/templates/arai-sk6/red-yellow/lines-mask.png', '#d7261e', true, false, true, 9
from public.design_templates t
where t.product_slug = 'red-yellow' and t.model_id = 'arai-sk6'
on conflict (template_id, key) do nothing;

insert into public.products (slug, name, tagline, description, category, model_ids, base_price, badge, features, specs, look, is_active, sort_order)
values (
  'blue-current', 'Blue Current', 'White with blue and navy.',
  'A karting design drawn for the Arai SK-6. Change the colour of any zone, or dip it in a film.',
  'racing-lines', array['arai-sk6'], 295, 'New',
  array['Designed for the Arai SK-6', 'Every colour zone can be changed', 'Names, numbers and logos can be added'],
  '[{"label":"Clear coat","value":"2K automotive lacquer, gloss or matte"},{"label":"Approval","value":"Digital proof signed off before we start"}]'::jsonb,
  '{"layout":"apex","finish":"gloss","base":"#f4f3ee","graphic":"#14254d","accent":"#14254d","film":"none","trim":"#111412","spoiler":false}'::jsonb,
  true, 104
)
on conflict (slug) do nothing;

insert into public.design_templates (product_slug, model_id, svg_url, thumbnail_url, artwork_status, is_active, sort_order)
select 'blue-current', 'arai-sk6', '/models/templates/arai-sk6/blue-current/artwork.webp', '/models/templates/arai-sk6/blue-current/thumbnail.png', 'ready', true, 0
where not exists (select 1 from public.design_templates t where t.product_slug = 'blue-current' and t.model_id = 'arai-sk6');

insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, allows_film, allows_chrome, allows_metallic, sort_order, coverage)
select t.id, zones.key, zones.label, 'fill', '/models/templates/arai-sk6/blue-current/' || zones.key || '-mask.png', zones.colour, true, zones.key <> 'base', true, zones.sort_order, zones.coverage
from public.design_templates t
join (values
  ('base', 'White', '#f4f3ee', 1, 0.3645),
  ('graphic', 'Blue', '#14254d', 2, 0.3339),
  ('accent', 'Navy', '#14254d', 3, 0.1966),
  ('detail', 'Teal blue', '#0f8b8d', 4, 0.0712),
  ('rim', 'Teal blue 2', '#0f8b8d', 5, 0.0339)
) as zones (key, label, colour, sort_order, coverage) on true
where t.product_slug = 'blue-current' and t.model_id = 'arai-sk6'
on conflict (template_id, key) do nothing;

insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, allows_film, allows_chrome, allows_metallic, sort_order)
select t.id, 'lines', 'Racing lines', 'pinstripe', '/models/templates/arai-sk6/blue-current/lines-mask.png', '#14254d', true, false, true, 9
from public.design_templates t
where t.product_slug = 'blue-current' and t.model_id = 'arai-sk6'
on conflict (template_id, key) do nothing;

insert into public.products (slug, name, tagline, description, category, model_ids, base_price, badge, features, specs, look, is_active, sort_order)
values (
  'crimson-apex', 'Crimson Apex', 'White with navy and red.',
  'A karting design drawn for the Arai SK-6. Change the colour of any zone, or dip it in a film.',
  'racing-lines', array['arai-sk6'], 295, 'New',
  array['Designed for the Arai SK-6', 'Every colour zone can be changed', 'Names, numbers and logos can be added'],
  '[{"label":"Clear coat","value":"2K automotive lacquer, gloss or matte"},{"label":"Approval","value":"Digital proof signed off before we start"}]'::jsonb,
  '{"layout":"apex","finish":"gloss","base":"#f4f3ee","graphic":"#14254d","accent":"#d7261e","film":"none","trim":"#111412","spoiler":false}'::jsonb,
  true, 105
)
on conflict (slug) do nothing;

insert into public.design_templates (product_slug, model_id, svg_url, thumbnail_url, artwork_status, is_active, sort_order)
select 'crimson-apex', 'arai-sk6', '/models/templates/arai-sk6/crimson-apex/artwork.webp', '/models/templates/arai-sk6/crimson-apex/thumbnail.png', 'ready', true, 0
where not exists (select 1 from public.design_templates t where t.product_slug = 'crimson-apex' and t.model_id = 'arai-sk6');

insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, allows_film, allows_chrome, allows_metallic, sort_order, coverage)
select t.id, zones.key, zones.label, 'fill', '/models/templates/arai-sk6/crimson-apex/' || zones.key || '-mask.png', zones.colour, true, zones.key <> 'base', true, zones.sort_order, zones.coverage
from public.design_templates t
join (values
  ('base', 'White', '#f4f3ee', 1, 0.4067),
  ('graphic', 'Navy', '#14254d', 2, 0.2548),
  ('accent', 'Red', '#d7261e', 3, 0.2301),
  ('detail', 'Silver', '#c4c7c9', 4, 0.1084)
) as zones (key, label, colour, sort_order, coverage) on true
where t.product_slug = 'crimson-apex' and t.model_id = 'arai-sk6'
on conflict (template_id, key) do nothing;

insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, allows_film, allows_chrome, allows_metallic, sort_order)
select t.id, 'lines', 'Racing lines', 'pinstripe', '/models/templates/arai-sk6/crimson-apex/lines-mask.png', '#d7261e', true, false, true, 9
from public.design_templates t
where t.product_slug = 'crimson-apex' and t.model_id = 'arai-sk6'
on conflict (template_id, key) do nothing;

insert into public.products (slug, name, tagline, description, category, model_ids, base_price, badge, features, specs, look, is_active, sort_order)
values (
  'jade-circuit', 'Jade Circuit', 'White with teal and dark green.',
  'A karting design drawn for the Arai SK-6. Change the colour of any zone, or dip it in a film.',
  'racing-lines', array['arai-sk6'], 295, 'New',
  array['Designed for the Arai SK-6', 'Every colour zone can be changed', 'Names, numbers and logos can be added'],
  '[{"label":"Clear coat","value":"2K automotive lacquer, gloss or matte"},{"label":"Approval","value":"Digital proof signed off before we start"}]'::jsonb,
  '{"layout":"apex","finish":"gloss","base":"#f4f3ee","graphic":"#0f8b8d","accent":"#14254d","film":"none","trim":"#111412","spoiler":false}'::jsonb,
  true, 106
)
on conflict (slug) do nothing;

insert into public.design_templates (product_slug, model_id, svg_url, thumbnail_url, artwork_status, is_active, sort_order)
select 'jade-circuit', 'arai-sk6', '/models/templates/arai-sk6/jade-circuit/artwork.webp', '/models/templates/arai-sk6/jade-circuit/thumbnail.png', 'ready', true, 0
where not exists (select 1 from public.design_templates t where t.product_slug = 'jade-circuit' and t.model_id = 'arai-sk6');

insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, allows_film, allows_chrome, allows_metallic, sort_order, coverage)
select t.id, zones.key, zones.label, 'fill', '/models/templates/arai-sk6/jade-circuit/' || zones.key || '-mask.png', zones.colour, true, zones.key <> 'base', true, zones.sort_order, zones.coverage
from public.design_templates t
join (values
  ('base', 'White', '#f4f3ee', 1, 0.5035),
  ('graphic', 'Teal', '#0f8b8d', 2, 0.2260),
  ('accent', 'Dark green', '#14254d', 3, 0.1909),
  ('detail', 'Mint', '#0f8b8d', 4, 0.0796)
) as zones (key, label, colour, sort_order, coverage) on true
where t.product_slug = 'jade-circuit' and t.model_id = 'arai-sk6'
on conflict (template_id, key) do nothing;

insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, allows_film, allows_chrome, allows_metallic, sort_order)
select t.id, 'lines', 'Racing lines', 'pinstripe', '/models/templates/arai-sk6/jade-circuit/lines-mask.png', '#14254d', true, false, true, 9
from public.design_templates t
where t.product_slug = 'jade-circuit' and t.model_id = 'arai-sk6'
on conflict (template_id, key) do nothing;

insert into public.products (slug, name, tagline, description, category, model_ids, base_price, badge, features, specs, look, is_active, sort_order)
values (
  'magenta-vector', 'Magenta Vector', 'Navy with magenta and white.',
  'A karting design drawn for the Arai SK-6. Change the colour of any zone, or dip it in a film.',
  'racing-lines', array['arai-sk6'], 295, 'New',
  array['Designed for the Arai SK-6', 'Every colour zone can be changed', 'Names, numbers and logos can be added'],
  '[{"label":"Clear coat","value":"2K automotive lacquer, gloss or matte"},{"label":"Approval","value":"Digital proof signed off before we start"}]'::jsonb,
  '{"layout":"apex","finish":"gloss","base":"#14254d","graphic":"#ff5fa2","accent":"#f4f3ee","film":"none","trim":"#111412","spoiler":false}'::jsonb,
  true, 107
)
on conflict (slug) do nothing;

insert into public.design_templates (product_slug, model_id, svg_url, thumbnail_url, artwork_status, is_active, sort_order)
select 'magenta-vector', 'arai-sk6', '/models/templates/arai-sk6/magenta-vector/artwork.webp', '/models/templates/arai-sk6/magenta-vector/thumbnail.png', 'ready', true, 0
where not exists (select 1 from public.design_templates t where t.product_slug = 'magenta-vector' and t.model_id = 'arai-sk6');

insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, allows_film, allows_chrome, allows_metallic, sort_order, coverage)
select t.id, zones.key, zones.label, 'fill', '/models/templates/arai-sk6/magenta-vector/' || zones.key || '-mask.png', zones.colour, true, zones.key <> 'base', true, zones.sort_order, zones.coverage
from public.design_templates t
join (values
  ('base', 'Navy', '#14254d', 1, 0.3488),
  ('graphic', 'Magenta', '#ff5fa2', 2, 0.2446),
  ('accent', 'White', '#f4f3ee', 3, 0.2077),
  ('detail', 'Purple', '#6a3fb5', 4, 0.1989)
) as zones (key, label, colour, sort_order, coverage) on true
where t.product_slug = 'magenta-vector' and t.model_id = 'arai-sk6'
on conflict (template_id, key) do nothing;

insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, allows_film, allows_chrome, allows_metallic, sort_order)
select t.id, 'lines', 'Racing lines', 'pinstripe', '/models/templates/arai-sk6/magenta-vector/lines-mask.png', '#f4f3ee', true, false, true, 9
from public.design_templates t
where t.product_slug = 'magenta-vector' and t.model_id = 'arai-sk6'
on conflict (template_id, key) do nothing;

insert into public.products (slug, name, tagline, description, category, model_ids, base_price, badge, features, specs, look, is_active, sort_order)
values (
  'amber-vortex', 'Amber Vortex', 'Navy with orange and white.',
  'A karting design drawn for the Arai SK-6. Change the colour of any zone, or dip it in a film.',
  'racing-lines', array['arai-sk6'], 295, 'New',
  array['Designed for the Arai SK-6', 'Every colour zone can be changed', 'Names, numbers and logos can be added'],
  '[{"label":"Clear coat","value":"2K automotive lacquer, gloss or matte"},{"label":"Approval","value":"Digital proof signed off before we start"}]'::jsonb,
  '{"layout":"apex","finish":"gloss","base":"#14254d","graphic":"#ff6a13","accent":"#f4f3ee","film":"none","trim":"#111412","spoiler":false}'::jsonb,
  true, 108
)
on conflict (slug) do nothing;

insert into public.design_templates (product_slug, model_id, svg_url, thumbnail_url, artwork_status, is_active, sort_order)
select 'amber-vortex', 'arai-sk6', '/models/templates/arai-sk6/amber-vortex/artwork.webp', '/models/templates/arai-sk6/amber-vortex/thumbnail.png', 'ready', true, 0
where not exists (select 1 from public.design_templates t where t.product_slug = 'amber-vortex' and t.model_id = 'arai-sk6');

insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, allows_film, allows_chrome, allows_metallic, sort_order, coverage)
select t.id, zones.key, zones.label, 'fill', '/models/templates/arai-sk6/amber-vortex/' || zones.key || '-mask.png', zones.colour, true, zones.key <> 'base', true, zones.sort_order, zones.coverage
from public.design_templates t
join (values
  ('base', 'Navy', '#14254d', 1, 0.5073),
  ('graphic', 'Orange', '#ff6a13', 2, 0.2790),
  ('accent', 'White', '#f4f3ee', 3, 0.1722),
  ('detail', 'Orange 2', '#d7261e', 4, 0.0415)
) as zones (key, label, colour, sort_order, coverage) on true
where t.product_slug = 'amber-vortex' and t.model_id = 'arai-sk6'
on conflict (template_id, key) do nothing;

insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, allows_film, allows_chrome, allows_metallic, sort_order)
select t.id, 'lines', 'Racing lines', 'pinstripe', '/models/templates/arai-sk6/amber-vortex/lines-mask.png', '#f4f3ee', true, false, true, 9
from public.design_templates t
where t.product_slug = 'amber-vortex' and t.model_id = 'arai-sk6'
on conflict (template_id, key) do nothing;

insert into public.products (slug, name, tagline, description, category, model_ids, base_price, badge, features, specs, look, is_active, sort_order)
values (
  'arctic-spear', 'Arctic Spear', 'White with navy and light blue.',
  'A karting design drawn for the Arai SK-6. Change the colour of any zone, or dip it in a film.',
  'racing-lines', array['arai-sk6'], 295, 'New',
  array['Designed for the Arai SK-6', 'Every colour zone can be changed', 'Names, numbers and logos can be added'],
  '[{"label":"Clear coat","value":"2K automotive lacquer, gloss or matte"},{"label":"Approval","value":"Digital proof signed off before we start"}]'::jsonb,
  '{"layout":"apex","finish":"gloss","base":"#f4f3ee","graphic":"#14254d","accent":"#0f8b8d","film":"none","trim":"#111412","spoiler":false}'::jsonb,
  true, 109
)
on conflict (slug) do nothing;

insert into public.design_templates (product_slug, model_id, svg_url, thumbnail_url, artwork_status, is_active, sort_order)
select 'arctic-spear', 'arai-sk6', '/models/templates/arai-sk6/arctic-spear/artwork.webp', '/models/templates/arai-sk6/arctic-spear/thumbnail.png', 'ready', true, 0
where not exists (select 1 from public.design_templates t where t.product_slug = 'arctic-spear' and t.model_id = 'arai-sk6');

insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, allows_film, allows_chrome, allows_metallic, sort_order, coverage)
select t.id, zones.key, zones.label, 'fill', '/models/templates/arai-sk6/arctic-spear/' || zones.key || '-mask.png', zones.colour, true, zones.key <> 'base', true, zones.sort_order, zones.coverage
from public.design_templates t
join (values
  ('base', 'White', '#f4f3ee', 1, 0.4141),
  ('graphic', 'Navy', '#14254d', 2, 0.1999),
  ('accent', 'Light blue', '#0f8b8d', 3, 0.1631),
  ('detail', 'Navy 2', '#14254d', 4, 0.1385),
  ('rim', 'Light blue 2', '#0f8b8d', 5, 0.0844)
) as zones (key, label, colour, sort_order, coverage) on true
where t.product_slug = 'arctic-spear' and t.model_id = 'arai-sk6'
on conflict (template_id, key) do nothing;

insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, allows_film, allows_chrome, allows_metallic, sort_order)
select t.id, 'lines', 'Racing lines', 'pinstripe', '/models/templates/arai-sk6/arctic-spear/lines-mask.png', '#0f8b8d', true, false, true, 9
from public.design_templates t
where t.product_slug = 'arctic-spear' and t.model_id = 'arai-sk6'
on conflict (template_id, key) do nothing;
