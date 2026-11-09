-- The 3D artist's updated Bell KC7 (vent holes, chin spoiler, Bell badges) and ten new
-- full-colour templates. Names and taglines are placeholders the client can change in
-- admin (Helmet builder → Templates); prices match the other templates.

with new_products (slug, name, tagline, description, sort_order, look) as (
  values
    ('pink-blade', 'Pink Blade', 'Hot pink blades over black and silver.',
     'Layered pink blades cut through black and silver. Change the colour of any zone, or dip it in a film.',
     3, '{"layout":"apex","finish":"gloss","base":"#111412","graphic":"#e5157f","accent":"#d4d6d8","film":"none","trim":"#111412","spoiler":false}'::jsonb),
    ('navy-pink', 'Navy Pink', 'Navy and pink stripes on white.',
     'Navy and pink bands stacked across a white helmet. Change the colour of any zone, or dip it in a film.',
     4, '{"layout":"apex","finish":"gloss","base":"#16295a","graphic":"#e5157f","accent":"#f4f3ee","film":"none","trim":"#111412","spoiler":false}'::jsonb),
    ('ivory-gold', 'Ivory Gold', 'White with fine black and gold lines.',
     'A clean white helmet with black blades and gold pinlines. Change the colour of any zone, or dip it in a film.',
     5, '{"layout":"apex","finish":"gloss","base":"#f4f3ee","graphic":"#111412","accent":"#c9a227","film":"none","trim":"#111412","spoiler":false}'::jsonb),
    ('neon-volt', 'Neon Volt', 'Fluoro yellow and white over a black pattern.',
     'Fluoro yellow strikes and white panels over a black geometric pattern. Change the colour of any zone, or dip it in a film.',
     6, '{"layout":"apex","finish":"gloss","base":"#e9ebec","graphic":"#e3f20a","accent":"#111412","film":"none","trim":"#111412","spoiler":false}'::jsonb),
    ('tricolore', 'Tricolore', 'Green, white and orange-red.',
     'Green and orange-red zigzags on white and silver. Change the colour of any zone, or dip it in a film.',
     7, '{"layout":"apex","finish":"gloss","base":"#e9ebec","graphic":"#1c8a45","accent":"#e5461b","film":"none","trim":"#111412","spoiler":false}'::jsonb),
    ('inferno', 'Inferno', 'Orange flames with fluoro yellow.',
     'Bright orange with fluoro yellow lightning and white flashes. Change the colour of any zone, or dip it in a film.',
     8, '{"layout":"apex","finish":"gloss","base":"#fd5602","graphic":"#e8fb07","accent":"#f4f3f2","film":"none","trim":"#111412","spoiler":false}'::jsonb),
    ('strike-red', 'Strike Red', 'Black with red and white strikes.',
     'Bold red and white strikes over a black helmet. Change the colour of any zone, or dip it in a film.',
     9, '{"layout":"apex","finish":"gloss","base":"#141416","graphic":"#e11817","accent":"#e8e9ed","film":"none","trim":"#111412","spoiler":false}'::jsonb),
    ('red-fury', 'Red Fury', 'Red with sharp black and white blades.',
     'A red helmet with sharp black blades and white highlights. Change the colour of any zone, or dip it in a film.',
     10, '{"layout":"apex","finish":"gloss","base":"#c70000","graphic":"#0f0d0c","accent":"#e8e9ed","film":"none","trim":"#111412","spoiler":false}'::jsonb),
    ('sky-racer', 'Sky Racer', 'Sky blue, white and red.',
     'Sky blue panels with white blades and red details. Change the colour of any zone, or dip it in a film.',
     11, '{"layout":"apex","finish":"gloss","base":"#0183d4","graphic":"#e10301","accent":"#f4f3ee","film":"none","trim":"#111412","spoiler":false}'::jsonb),
    ('gold-line', 'Gold Line', 'White and black with gold edges.',
     'White and black blades outlined in gold. Change the colour of any zone, or dip it in a film.',
     12, '{"layout":"apex","finish":"gloss","base":"#f4f3ee","graphic":"#181818","accent":"#c9a227","film":"none","trim":"#111412","spoiler":false}'::jsonb)
)
insert into public.products (slug, name, tagline, description, category, model_ids, base_price, badge, features, specs, look, is_active, sort_order)
select slug, name, tagline, description, 'racing-lines', array['bell-kc7'], 295, 'New',
  array['Designed for the Bell KC7', 'Every colour zone can be changed', 'Names, numbers and logos can be added'],
  '[{"label":"Clear coat","value":"2K automotive lacquer, gloss or matte"},{"label":"Approval","value":"Digital proof signed off before we start"}]'::jsonb,
  look, true, sort_order
from new_products
on conflict (slug) do nothing;

insert into public.design_templates (product_slug, model_id, svg_url, thumbnail_url, artwork_status, is_active, sort_order)
select slug, 'bell-kc7', '/models/templates/bell-kc7/' || slug || '/artwork.webp', '/models/templates/bell-kc7/' || slug || '/thumbnail.png', 'ready', true, 0
from (values ('pink-blade'), ('navy-pink'), ('ivory-gold'), ('neon-volt'), ('tricolore'), ('inferno'), ('strike-red'), ('red-fury'), ('sky-racer'), ('gold-line')) as designs (slug)
where not exists (select 1 from public.design_templates t where t.product_slug = designs.slug and t.model_id = 'bell-kc7');

-- Each design's colour zones, as scripts/prepare-artwork-templates.mjs cuts them.
insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, allows_film, allows_chrome, allows_metallic, sort_order)
select t.id, zones.key, zones.label, 'fill', '/models/templates/bell-kc7/' || t.product_slug || '/' || zones.key || '-mask.png',
  zones.colour, true, zones.key <> 'base', true, zones.sort_order
from public.design_templates t
join (values
  ('pink-blade', 'base', 'Black', '#111412', 1),
  ('pink-blade', 'graphic', 'Pink blades', '#e5157f', 2),
  ('pink-blade', 'accent', 'Silver', '#d4d6d8', 3),
  ('navy-pink', 'base', 'Navy', '#16295a', 1),
  ('navy-pink', 'graphic', 'Pink stripes', '#e5157f', 2),
  ('navy-pink', 'accent', 'White', '#f4f3ee', 3),
  ('ivory-gold', 'base', 'White', '#f4f3ee', 1),
  ('ivory-gold', 'graphic', 'Black blades', '#111412', 2),
  ('ivory-gold', 'accent', 'Gold lines', '#c9a227', 3),
  ('neon-volt', 'base', 'White and silver', '#e9ebec', 1),
  ('neon-volt', 'graphic', 'Fluoro yellow', '#e3f20a', 2),
  ('neon-volt', 'accent', 'Black pattern', '#111412', 3),
  ('tricolore', 'base', 'White and silver', '#e9ebec', 1),
  ('tricolore', 'graphic', 'Green', '#1c8a45', 2),
  ('tricolore', 'accent', 'Orange-red', '#e5461b', 3),
  ('inferno', 'base', 'Orange', '#fd5602', 1),
  ('inferno', 'graphic', 'Fluoro yellow', '#e8fb07', 2),
  ('inferno', 'accent', 'White', '#f4f3f2', 3),
  ('strike-red', 'base', 'Black and grey', '#141416', 1),
  ('strike-red', 'graphic', 'Red strikes', '#e11817', 2),
  ('strike-red', 'accent', 'White', '#e8e9ed', 3),
  ('red-fury', 'base', 'Red', '#c70000', 1),
  ('red-fury', 'graphic', 'Black blades', '#0f0d0c', 2),
  ('red-fury', 'accent', 'White', '#e8e9ed', 3),
  ('sky-racer', 'base', 'Sky blue', '#0183d4', 1),
  ('sky-racer', 'graphic', 'Red details', '#e10301', 2),
  ('sky-racer', 'accent', 'White', '#f4f3ee', 3),
  ('gold-line', 'base', 'White', '#f4f3ee', 1),
  ('gold-line', 'graphic', 'Black blades', '#181818', 2),
  ('gold-line', 'accent', 'Gold edges', '#c9a227', 3)
) as zones (slug, key, label, colour, sort_order) on zones.slug = t.product_slug
where t.model_id = 'bell-kc7'
on conflict (template_id, key) do nothing;

-- Racing lines along the borders between each design's colour zones.
insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, allows_film, allows_chrome, allows_metallic, sort_order)
select t.id, 'lines', 'Racing lines', 'pinstripe', '/models/templates/bell-kc7/' || t.product_slug || '/lines-mask.png', '#f4f3ee', true, false, false, 9
from public.design_templates t
where t.product_slug in ('pink-blade', 'navy-pink', 'ivory-gold', 'neon-volt', 'tricolore', 'inferno', 'strike-red', 'red-fury', 'sky-racer', 'gold-line')
  and t.model_id = 'bell-kc7'
on conflict (template_id, key) do nothing;

-- The new chin spoiler. Its price is a placeholder until the client confirms it (admin, Helmet builder → Aero).
insert into public.aero_kits (id, model_id, name, summary, mesh_name, price, is_active, sort_order)
values ('bell-kc7-chin-spoiler', 'bell-kc7', 'Chin spoiler', 'Clear aero lip under the chin vent.', 'Spoiler_Chin', 45, true, 4)
on conflict (id) do nothing;
