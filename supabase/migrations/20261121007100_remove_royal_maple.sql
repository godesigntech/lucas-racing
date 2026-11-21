-- Royal Maple, a traced template tried on both helmets on 21 Nov 2026, is removed
-- completely: it didn't look good on the 3D shells. Nothing used it (no orders, saved
-- designs, quotes or competition entries), so its rows are deleted.
delete from public.template_regions
where template_id in (select id from public.design_templates where product_slug = 'royal-maple');
delete from public.design_templates where product_slug = 'royal-maple';
delete from public.products where slug = 'royal-maple';
