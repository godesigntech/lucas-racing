-- The designer's full-colour templates for the Bell KC7. svg_url points at the artwork,
-- drawn on the shell's UVs; each region is one colour zone of it, shown as designed until
-- the customer changes it. Prices are placeholders until the client confirms them.
with new_products (slug, name, tagline, description, sort_order, look) as (
  values
    ('red-carbon', 'Red Carbon', 'Carbon weave, red strikes and silver blades.',
     'Sharp red strikes over a carbon crown, with brushed silver panels down each side. Change the colour of any zone, or dip it in a film.',
     -3, '{"layout":"apex","finish":"gloss","base":"#111412","graphic":"#d7261e","accent":"#f4f3ee","film":"none","trim":"#111412","spoiler":false}'::jsonb),
    ('neon-carbon', 'Neon Carbon', 'Neon yellow, teal camo and carbon.',
     'An asymmetric design of neon panels and teal camo over carbon. Change the colour of any zone, or dip it in a film.',
     -2, '{"layout":"apex","finish":"gloss","base":"#111412","graphic":"#c6f432","accent":"#f4f3ee","film":"none","trim":"#111412","spoiler":false}'::jsonb),
    ('maple-racing', 'Maple Racing', 'Red maple leaves with silver sweeps.',
     'Deep red maple leaves under flowing silver bands, edged in blue. Change the colour of any zone, or dip it in a film.',
     -1, '{"layout":"apex","finish":"gloss","base":"#1f5bd8","graphic":"#d7261e","accent":"#f4f3ee","film":"none","trim":"#111412","spoiler":false}'::jsonb)
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
from (values ('red-carbon'), ('neon-carbon'), ('maple-racing')) as designs (slug)
where not exists (select 1 from public.design_templates t where t.product_slug = designs.slug and t.model_id = 'bell-kc7');

insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, allows_film, allows_chrome, allows_metallic, sort_order)
select t.id, zones.key, zones.label, 'fill', '/models/templates/bell-kc7/' || t.product_slug || '/' || zones.key || '-mask.png',
  zones.colour, true, zones.key <> 'base', true, zones.sort_order
from public.design_templates t
join (values
  ('red-carbon', 'base', 'Black and carbon', '#111412', 1),
  ('red-carbon', 'graphic', 'Red panels', '#d7261e', 2),
  ('red-carbon', 'accent', 'White and silver', '#f4f3ee', 3),
  ('neon-carbon', 'base', 'Black and carbon', '#111412', 1),
  ('neon-carbon', 'graphic', 'Neon panels', '#c6f432', 2),
  ('neon-carbon', 'accent', 'White and silver', '#f4f3ee', 3),
  ('neon-carbon', 'detail', 'Teal camo', '#0f8b8d', 4),
  ('maple-racing', 'base', 'Blue lines and details', '#1f5bd8', 1),
  ('maple-racing', 'graphic', 'Red and maple', '#d7261e', 2),
  ('maple-racing', 'accent', 'White and silver', '#f4f3ee', 3)
) as zones (slug, key, label, colour, sort_order) on zones.slug = t.product_slug
where t.model_id = 'bell-kc7'
on conflict (template_id, key) do nothing;
