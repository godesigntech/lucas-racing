-- Reopening a cancelled order takes its products out of stock again, so cancelling,
-- reopening and cancelling again can't add the same stock back twice.

create or replace function public.restock_cancelled_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_line record;
  v_after integer;
  v_sign integer;
  v_reason text;
  v_note text;
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    v_sign := 1;
    v_reason := 'cancellation';
    v_note := 'Order ' || new.order_number || ' cancelled';
  elsif old.status = 'cancelled' and new.status is distinct from 'cancelled' then
    v_sign := -1;
    v_reason := 'order';
    v_note := 'Order ' || new.order_number || ' reopened';
  else
    return new;
  end if;

  for v_line in
    select oi.shop_variant_id, oi.quantity
    from public.order_items oi
    join public.shop_variants v on v.id = oi.shop_variant_id
    where oi.order_id = new.id and oi.line_kind = 'product' and v.track_stock
  loop
    update public.shop_variants set stock_quantity = stock_quantity + v_sign * v_line.quantity
    where id = v_line.shop_variant_id
    returning stock_quantity into v_after;
    insert into public.inventory_movements (variant_id, change, quantity_after, reason, order_id, note, created_by)
    values (v_line.shop_variant_id, v_sign * v_line.quantity, v_after, v_reason, new.id, v_note, auth.uid());
  end loop;
  return new;
end;
$$;
