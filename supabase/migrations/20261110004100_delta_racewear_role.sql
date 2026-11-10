-- Delta Racewear staff (Mary): a staff role that manages the Racewear shop ("delta")
-- catalogue (products, options, categories, stock and photos) and nothing else, like
-- Teamwear does for its shop. Shop staff are mapped to their shop by staff_store().

alter table public.admin_users drop constraint admin_users_role_check;
alter table public.admin_users
  add constraint admin_users_role_check check (role in ('admin', 'sales', 'teamwear', 'delta'));

-- The one shop the signed-in staff member runs, or null.
create or replace function public.staff_store()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case a.role when 'teamwear' then 'teamwear' when 'delta' then 'delta' end
  from public.admin_users a
  where a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  limit 1;
$$;

create or replace function public.is_shop_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.staff_store() is not null;
$$;

revoke all on function public.staff_store() from public;
revoke all on function public.is_shop_staff() from public;
grant execute on function public.staff_store() to anon, authenticated;
grant execute on function public.is_shop_staff() to anon, authenticated;

-- Racewear catalogue. (Teamwear keeps its own policies from 20261017002000.)
create policy "Delta manages racewear products" on public.shop_products
  for all to authenticated
  using (store_id = 'delta' and (select public.staff_store()) = 'delta')
  with check (store_id = 'delta' and (select public.staff_store()) = 'delta');

create policy "Delta manages racewear options" on public.shop_variants
  for all to authenticated
  using ((select public.staff_store()) = 'delta' and exists (select 1 from public.shop_products p where p.id = product_id and p.store_id = 'delta'))
  with check ((select public.staff_store()) = 'delta' and exists (select 1 from public.shop_products p where p.id = product_id and p.store_id = 'delta'));

create policy "Delta manages racewear categories" on public.shop_categories
  for all to authenticated
  using (store_id = 'delta' and (select public.staff_store()) = 'delta')
  with check (store_id = 'delta' and (select public.staff_store()) = 'delta');

create policy "Delta reads racewear stock history" on public.inventory_movements
  for select to authenticated using (
    (select public.staff_store()) = 'delta' and exists (
      select 1 from public.shop_variants v join public.shop_products p on p.id = v.product_id
      where v.id = variant_id and p.store_id = 'delta'
    )
  );

create policy "Product images: delta uploads" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and (select public.staff_store()) = 'delta');

-- Stock counts: admins for any product, shop staff for their own shop's products.
create or replace function public.set_variant_stock(p_variant_id uuid, p_quantity integer, p_note text default '')
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current integer;
  v_store text;
begin
  select p.store_id into v_store
  from public.shop_variants v join public.shop_products p on p.id = v.product_id
  where v.id = p_variant_id;
  if not (public.is_full_admin() or (v_store is not null and v_store = public.staff_store())) then
    raise exception 'You don''t have permission to change stock.' using errcode = '28000';
  end if;
  if p_quantity is null or p_quantity < -100000 or p_quantity > 100000 then
    raise exception 'Enter a stock level between -100,000 and 100,000.' using errcode = '22023';
  end if;

  select stock_quantity into v_current from public.shop_variants where id = p_variant_id for update;
  if not found then
    raise exception 'That product option no longer exists.' using errcode = '22023';
  end if;
  if v_current = p_quantity then
    return p_quantity;
  end if;

  update public.shop_variants set stock_quantity = p_quantity where id = p_variant_id;
  insert into public.inventory_movements (variant_id, change, quantity_after, reason, note, created_by)
  values (p_variant_id, p_quantity - v_current, p_quantity, 'adjustment', left(coalesce(p_note, ''), 500), auth.uid());
  return p_quantity;
end;
$$;
