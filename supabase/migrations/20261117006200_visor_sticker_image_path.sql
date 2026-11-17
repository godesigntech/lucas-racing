-- The visor sticker's photo without a ?v= query: product images go through Next's image
-- optimiser, which only takes plain local paths (the basket failed to show it).
update public.shop_products
set images = array['/stickers/lucas-racing-visor.webp']
where store_id = 'hydrokarts-parts' and slug = 'visor-sticker';
