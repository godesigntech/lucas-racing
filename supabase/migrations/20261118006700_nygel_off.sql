-- The Nygel template comes off the website (client, 18 Nov 2026). Switched off, not
-- deleted, so saved designs and past orders that used it still open.
update public.products set is_active = false where slug = 'nygel';
update public.design_templates set is_active = false where product_slug = 'nygel';
