-- Red Carbon, Neon Carbon and Maple Racing come off sale, leaving Emilio, Nygel and Rusinov.
-- Kept in the tables, not deleted, because saved designs may still refer to them.
update public.products set is_active = false where slug in ('red-carbon', 'neon-carbon', 'maple-racing');
update public.design_templates set is_active = false where product_slug in ('red-carbon', 'neon-carbon', 'maple-racing');
