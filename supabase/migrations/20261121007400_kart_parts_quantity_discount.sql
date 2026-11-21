-- Quantity discount on custom-finished kart parts (client's price calculator, 21 Nov 2026):
-- the more parts finished in one order, the bigger the discount on those parts:
--   2 parts 10%, 3 parts 20%, 4 parts 30%, 5 or more 40%.
-- A part or set is one part (a pair of stub axles counts once; two pairs count twice).
-- Only custom-finished parts count and are discounted, not helmets or stock MS Kart parts.
-- The rates are in site settings, edited in Admin > Settings.
--
-- Orders keep the parts discount in its own column, apart from a voucher's
-- discount_amount, and the total and deposit are worked out again when the order's lines
-- are saved, so place_order() and place_order_with_voucher() don't change.

alter table public.site_settings
  add column if not exists parts_discounts jsonb not null
  default '[{"parts": 2, "percent": 10}, {"parts": 3, "percent": 20}, {"parts": 4, "percent": 30}, {"parts": 5, "percent": 40}]'::jsonb;

alter table public.orders
  add column if not exists parts_discount numeric(10, 2) not null default 0 check (parts_discount >= 0);

-- How much an order's custom-finished kart parts are discounted by, from the settings.
create or replace function public.order_parts_discount(p_order uuid)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  with parts as (
    select coalesce(sum(i.quantity), 0) as count, coalesce(sum(i.line_total), 0) as total
    from public.order_items i
    join public.shop_variants v on v.id = i.shop_variant_id
    join public.shop_products p on p.id = v.product_id
    where i.order_id = p_order and i.line_kind = 'product' and p.customisable
      and jsonb_typeof(i.configuration -> 'finish') = 'object'
  ),
  rate as (
    select coalesce(max((tier ->> 'percent')::numeric), 0) as percent
    from public.site_settings s, jsonb_array_elements(s.parts_discounts) as tier, parts
    where s.id = 1 and (tier ->> 'parts')::integer <= parts.count
  )
  select round(parts.total * least(rate.percent, 100) / 100.0, 2) from parts, rate;
$$;

-- Runs as each line is saved: the discount, total and deposit are set again, so the result
-- is the same however many lines the order has. A voucher applied afterwards takes its
-- own amount off this total.
create or replace function public.order_items_apply_parts_discount()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_discount numeric(10, 2) := public.order_parts_discount(new.order_id);
begin
  update public.orders o
  set total = o.total + o.parts_discount - v_discount, parts_discount = v_discount
  where o.id = new.order_id and o.parts_discount is distinct from v_discount;
  update public.orders o set deposit_amount = public.order_deposit_amount(o.id) where o.id = new.order_id;
  return null;
end;
$$;

drop trigger if exists order_items_apply_parts_discount on public.order_items;
create trigger order_items_apply_parts_discount
  after insert on public.order_items
  for each row execute function public.order_items_apply_parts_discount();

revoke all on function public.order_parts_discount(uuid) from public;
revoke all on function public.order_items_apply_parts_discount() from public;
