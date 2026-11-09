-- The ten new templates open "as designed" only when each zone's starting colour matches
-- the zone's default. The builder starts every zone on the palette swatch nearest the
-- design's colours, so the defaults (and the showcase look) use those same swatches.

update public.template_regions r
set default_colour = swatches.colour
from public.design_templates t,
  (values
    ('pink-blade', 'base', '#111412'), ('pink-blade', 'graphic', '#ff5fa2'), ('pink-blade', 'accent', '#c4c7c9'),
    ('navy-pink', 'base', '#14254d'), ('navy-pink', 'graphic', '#ff5fa2'), ('navy-pink', 'accent', '#f4f3ee'),
    ('ivory-gold', 'base', '#f4f3ee'), ('ivory-gold', 'graphic', '#111412'), ('ivory-gold', 'accent', '#c9a227'),
    ('neon-volt', 'base', '#f4f3ee'), ('neon-volt', 'graphic', '#c6f432'), ('neon-volt', 'accent', '#111412'),
    ('tricolore', 'base', '#f4f3ee'), ('tricolore', 'graphic', '#1f9d55'), ('tricolore', 'accent', '#d7261e'),
    ('inferno', 'base', '#ff6a13'), ('inferno', 'graphic', '#c6f432'), ('inferno', 'accent', '#f4f3ee'),
    ('strike-red', 'base', '#111412'), ('strike-red', 'graphic', '#d7261e'), ('strike-red', 'accent', '#f4f3ee'),
    ('red-fury', 'base', '#d7261e'), ('red-fury', 'graphic', '#111412'), ('red-fury', 'accent', '#f4f3ee'),
    ('sky-racer', 'base', '#1f5bd8'), ('sky-racer', 'graphic', '#d7261e'), ('sky-racer', 'accent', '#f4f3ee'),
    ('gold-line', 'base', '#f4f3ee'), ('gold-line', 'graphic', '#111412'), ('gold-line', 'accent', '#c9a227')
  ) as swatches (slug, key, colour)
where r.template_id = t.id
  and t.model_id = 'bell-kc7'
  and t.product_slug = swatches.slug
  and r.key = swatches.key;

update public.products p
set look = p.look || jsonb_build_object('base', looks.base, 'graphic', looks.graphic, 'accent', looks.accent)
from (values
  ('pink-blade', '#111412', '#ff5fa2', '#c4c7c9'),
  ('navy-pink', '#14254d', '#ff5fa2', '#f4f3ee'),
  ('ivory-gold', '#f4f3ee', '#111412', '#c9a227'),
  ('neon-volt', '#f4f3ee', '#c6f432', '#111412'),
  ('tricolore', '#f4f3ee', '#1f9d55', '#d7261e'),
  ('inferno', '#ff6a13', '#c6f432', '#f4f3ee'),
  ('strike-red', '#111412', '#d7261e', '#f4f3ee'),
  ('red-fury', '#d7261e', '#111412', '#f4f3ee'),
  ('sky-racer', '#1f5bd8', '#d7261e', '#f4f3ee'),
  ('gold-line', '#f4f3ee', '#111412', '#c9a227')
) as looks (slug, base, graphic, accent)
where p.slug = looks.slug;
