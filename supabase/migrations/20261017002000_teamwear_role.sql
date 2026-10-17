-- Phase 9: Wendy's Teamwear.
-- A "teamwear" staff role that can manage Teamwear products, options, stock,
-- categories and photos, and see orders containing teamwear, and nothing else.
-- is_admin() now means Admin or Sales only, so every existing staff rule keeps
-- working exactly as before for those roles and never applies to Teamwear.

alter table public.admin_users drop constraint admin_users_role_check;
alter table public.admin_users
  add constraint admin_users_role_check check (role in ('admin', 'sales', 'teamwear'));

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users a
    where a.email = lower(coalesce(auth.jwt() ->> 'email', '')) and a.role in ('admin', 'sales')
  );
$$;

create or replace function public.is_teamwear()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users a
    where a.email = lower(coalesce(auth.jwt() ->> 'email', '')) and a.role = 'teamwear'
  );
$$;

revoke all on function public.is_teamwear() from public;
grant execute on function public.is_teamwear() to anon, authenticated;

-- Every staff member can see their own entry, so the site knows their role.
create policy "Staff read own entry" on public.admin_users
  for select to authenticated using (email = lower(coalesce(auth.jwt() ->> 'email', '')));

-- ---------------------------------------------------------------------------
-- Size guides on products (shown on the product page; Markdown tables allowed).
-- ---------------------------------------------------------------------------
alter table public.shop_products
  add column size_guide text not null default '' check (char_length(size_guide) <= 8000);

-- ---------------------------------------------------------------------------
-- Teamwear catalogue
-- ---------------------------------------------------------------------------
create policy "Teamwear manages teamwear products" on public.shop_products
  for all to authenticated
  using (store_id = 'teamwear' and (select public.is_teamwear()))
  with check (store_id = 'teamwear' and (select public.is_teamwear()));

create policy "Teamwear manages teamwear options" on public.shop_variants
  for all to authenticated
  using ((select public.is_teamwear()) and exists (select 1 from public.shop_products p where p.id = product_id and p.store_id = 'teamwear'))
  with check ((select public.is_teamwear()) and exists (select 1 from public.shop_products p where p.id = product_id and p.store_id = 'teamwear'));

create policy "Teamwear manages teamwear categories" on public.shop_categories
  for all to authenticated
  using (store_id = 'teamwear' and (select public.is_teamwear()))
  with check (store_id = 'teamwear' and (select public.is_teamwear()));

create policy "Teamwear reads teamwear stock history" on public.inventory_movements
  for select to authenticated using (
    (select public.is_teamwear()) and exists (
      select 1 from public.shop_variants v join public.shop_products p on p.id = v.product_id
      where v.id = variant_id and p.store_id = 'teamwear'
    )
  );

create policy "Product images: teamwear uploads" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and (select public.is_teamwear()));

-- Stock counts: admins for any product, Teamwear for teamwear products.
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
  if not (public.is_full_admin() or (public.is_teamwear() and v_store = 'teamwear')) then
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

-- ---------------------------------------------------------------------------
-- Teamwear orders: read-only access to orders that contain teamwear.
-- ---------------------------------------------------------------------------
create or replace function public.order_has_teamwear(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.order_items oi where oi.order_id = p_order_id and oi.store_id = 'teamwear');
$$;

revoke all on function public.order_has_teamwear(uuid) from public;
grant execute on function public.order_has_teamwear(uuid) to authenticated;

create policy "Teamwear reads teamwear orders" on public.orders
  for select to authenticated using ((select public.is_teamwear()) and public.order_has_teamwear(id));

create policy "Teamwear reads teamwear order lines" on public.order_items
  for select to authenticated using ((select public.is_teamwear()) and public.order_has_teamwear(order_id));

create policy "Teamwear reads teamwear order history" on public.order_status_events
  for select to authenticated using ((select public.is_teamwear()) and public.order_has_teamwear(order_id));
