-- Product pages live at /shop/p/<slug> for every shop, so a slug must be unique
-- across all stores, not just within one.
create unique index shop_products_slug_idx on public.shop_products (slug);
