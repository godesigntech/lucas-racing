-- MS Kart parts by HydroKarts: live 2D preview.
-- Each customisable part can carry preview settings, edited in Admin > Shop:
--   { "image": "<photo url>", "mask": "<mask png url or null>", "detail": 0..1, "filmScale": 0.25..4 }
-- "mask" marks the area that gets the finish (white where finished). Without one, the
-- preview finds the part's outline from its plain background. Null means "use the main photo".

alter table public.shop_products
  add column custom_preview jsonb
    check (custom_preview is null or jsonb_typeof(custom_preview) = 'object');
