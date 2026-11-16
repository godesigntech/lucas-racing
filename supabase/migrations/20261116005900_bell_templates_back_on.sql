-- Red Fury, Sky Racer and Gold Line were switched back on as products (Bell KC7) on
-- 13 Nov, but their template records stayed off, so the builder fell back to its plain
-- three-zone view instead of the designers' artwork and zones. Switched on to match.
update public.design_templates
set is_active = true
where model_id = 'bell-kc7' and product_slug in ('red-fury', 'sky-racer', 'gold-line');
