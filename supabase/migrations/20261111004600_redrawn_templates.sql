-- Seven of the second set were redrawn on the exact Bell KC7 UV sheet (pink-blade,
-- navy-pink, ivory-gold, neon-volt, tricolore, inferno, strike-red): new artwork and masks,
-- same names and zones, so only how much of the shell each zone covers changes
-- (scripts/compute-zone-coverage.mjs).
update public.template_regions r
set coverage = shares.coverage
from public.design_templates t,
  (values
  ('inferno', 'base', 0.6856),
  ('inferno', 'graphic', 0.2325),
  ('inferno', 'accent', 0.0887),
  ('ivory-gold', 'base', 0.7407),
  ('ivory-gold', 'graphic', 0.1251),
  ('ivory-gold', 'accent', 0.1485),
  ('navy-pink', 'base', 0.3886),
  ('navy-pink', 'graphic', 0.2224),
  ('navy-pink', 'accent', 0.3971),
  ('neon-volt', 'base', 0.4832),
  ('neon-volt', 'graphic', 0.3076),
  ('neon-volt', 'accent', 0.2154),
  ('pink-blade', 'base', 0.2885),
  ('pink-blade', 'graphic', 0.3481),
  ('pink-blade', 'accent', 0.3726),
  ('strike-red', 'base', 0.5483),
  ('strike-red', 'graphic', 0.2078),
  ('strike-red', 'accent', 0.2492),
  ('tricolore', 'base', 0.4674),
  ('tricolore', 'graphic', 0.3135),
  ('tricolore', 'accent', 0.2266)
  ) as shares (slug, key, coverage)
where r.template_id = t.id and t.product_slug = shares.slug and r.key = shares.key;

-- Red Fury, Sky Racer and Gold Line were drawn on an older UV guide and leave parts of the
-- shell bare (filled only by stretching their edge colours), so they come out of the
-- builder. Switched off rather than deleted: an admin can switch them back on.
update public.products set is_active = false where slug in ('red-fury', 'sky-racer', 'gold-line');
update public.design_templates set is_active = false where product_slug in ('red-fury', 'sky-racer', 'gold-line');
