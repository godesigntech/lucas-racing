-- Phase 8: Delta Racewear. Suits are browse-only (the store isn't purchasable);
-- customers order on Delta's site. Clicks through to Delta are counted per product
-- so the client can see interest.

alter table public.shop_products
  add column external_clicks integer not null default 0 check (external_clicks >= 0);

/** Counts one click through to the partner's site for a browse-only product. */
create or replace function public.record_external_click(p_product_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
begin
  update public.shop_products p
  set external_clicks = p.external_clicks + 1
  where p.id = p_product_id
    and p.is_active
    and p.external_url is not null
    and exists (select 1 from public.stores s where s.id = p.store_id and not s.purchasable)
  returning p.external_url into v_url;
  return v_url;
end;
$$;

revoke all on function public.record_external_click(uuid) from public;
grant execute on function public.record_external_click(uuid) to anon, authenticated;

-- Starting categories for the Delta range; admins can rename or add more.
insert into public.shop_categories (store_id, name, slug, description, sort_order) values
  ('delta', 'Race suits', 'race-suits', 'Custom kart race suits, made by Delta Racewear.', 10),
  ('delta', 'Gloves', 'gloves', 'Race gloves from Delta Racewear.', 20),
  ('delta', 'Accessories', 'accessories', 'Boots, rib protectors and other Delta accessories.', 30)
on conflict do nothing;
