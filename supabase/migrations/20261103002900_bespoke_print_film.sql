-- Customers can upload their own artwork as a hydro-dip film for any part of a design.
-- The film row carries the price (set in admin, Helmet builder → Films) and a
-- placeholder texture; the artwork itself is stored with the build, in design-logos.
insert into public.films (id, name, category, pattern, price, is_active, sort_order, code, texture_url, thumb_url)
values ('bespoke-print', 'Your own print', 'Bespoke print', 'none', 75, true, 9999, 'BESPOKE', '/films/bespoke/your-print.svg', '/films/bespoke/your-print.svg')
on conflict (id) do nothing;

-- Clearer names for the editable areas: "Shell" and "Graphic" confused customers.
update public.template_regions set label = 'Base colour' where key = 'base' and label = 'Shell';
update public.template_regions set label = 'Design shapes' where key = 'graphic' and label = 'Graphic';
