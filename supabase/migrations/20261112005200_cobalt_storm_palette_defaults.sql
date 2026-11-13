-- Cobalt Storm's zone defaults must be palette swatches: the builder snaps colours to the
-- palette, and a zone only shows the artwork as drawn while its colour equals the default.
-- With off-palette defaults every zone opened recoloured flat instead of as designed.

update public.template_regions r
set default_colour = v.colour
from public.design_templates t,
  (values ('base', '#1f5bd8'), ('graphic', '#14254d'), ('accent', '#f4f3ee'), ('detail', '#1f5bd8')) as v (key, colour)
where r.template_id = t.id
  and t.product_slug = 'cobalt-storm' and t.model_id = 'bell-kc7'
  and r.key = v.key;

update public.products
set look = look || '{"base":"#1f5bd8","graphic":"#14254d","accent":"#f4f3ee","trim":"#14254d"}'::jsonb
where slug = 'cobalt-storm';
