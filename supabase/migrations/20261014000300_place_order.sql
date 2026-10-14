-- Lucas Racing: checkout. Prices are always computed here from the database,
-- never trusted from the browser.

create or replace function public.place_order(
  p_items jsonb,
  p_customer jsonb,
  p_shipping jsonb,
  p_delivery_method text,
  p_notes text default ''
)
returns table (order_id uuid, order_number text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_item jsonb;
  v_cfg jsonb;
  v_product public.products;
  v_model public.helmet_models;
  v_film public.films;
  v_option public.configurator_options;
  v_group text;
  v_qty integer;
  v_unit numeric(10, 2);
  v_subtotal numeric(10, 2) := 0;
  v_summary jsonb;
  v_lines jsonb := '[]'::jsonb;
  v_delivery jsonb;
  v_delivery_price numeric(10, 2);
  v_order_id uuid;
  v_order_number text;
  v_group_labels constant jsonb := jsonb_build_object(
    'route', 'How you''d like it',
    'finish', 'Base finish',
    'base', 'Base colour',
    'trim', 'Rubber trim',
    'spoiler', 'Rear spoiler'
  );
begin
  if v_user is null then
    raise exception 'Please sign in to place an order.' using errcode = '28000';
  end if;

  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your basket is empty.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) > 20 then
    raise exception 'Too many items in one order.' using errcode = '22023';
  end if;

  if coalesce(trim(p_customer ->> 'name'), '') = '' or coalesce(trim(p_customer ->> 'email'), '') = '' then
    raise exception 'Name and email are required.' using errcode = '22023';
  end if;

  select d.value into v_delivery
  from public.site_settings s
  cross join lateral jsonb_array_elements(s.delivery_methods) as d(value)
  where d.value ->> 'id' = p_delivery_method and coalesce((d.value ->> 'active')::boolean, true)
  limit 1;
  if v_delivery is null then
    raise exception 'Please choose a delivery option.' using errcode = '22023';
  end if;
  v_delivery_price := coalesce((v_delivery ->> 'price')::numeric, 0);

  if (v_delivery ->> 'requires_address')::boolean is not false
     and (coalesce(trim(p_shipping ->> 'line1'), '') = '' or coalesce(trim(p_shipping ->> 'postcode'), '') = '') then
    raise exception 'A delivery address is required for this delivery option.' using errcode = '22023';
  end if;

  for v_item in select item.value from jsonb_array_elements(p_items) as item(value)
  loop
    v_cfg := v_item -> 'config';
    v_qty := coalesce((v_item ->> 'quantity')::integer, 1);
    if v_qty < 1 or v_qty > 10 then
      raise exception 'Quantities must be between 1 and 10.' using errcode = '22023';
    end if;

    select * into v_product from public.products where slug = v_item ->> 'slug' and is_active;
    if not found then
      raise exception 'A design in your basket is no longer available.' using errcode = '22023';
    end if;
    if v_product.base_price is null then
      raise exception '% is priced on request. Please send us an enquiry instead.', v_product.name using errcode = '22023';
    end if;

    if not ((v_cfg ->> 'model') = any (v_product.model_ids)) then
      raise exception '% is not available on that helmet.', v_product.name using errcode = '22023';
    end if;
    select * into v_model from public.helmet_models where id = v_cfg ->> 'model' and is_active;
    if not found then
      raise exception 'That helmet model is no longer available.' using errcode = '22023';
    end if;
    if not ((v_cfg ->> 'size') = any (v_model.sizes)) then
      raise exception 'Please choose a valid helmet size.' using errcode = '22023';
    end if;

    select * into v_film from public.films where id = v_cfg ->> 'film' and is_active;
    if not found then
      raise exception 'That hydro-dip film is no longer available.' using errcode = '22023';
    end if;

    v_unit := v_product.base_price + v_film.price;
    v_summary := jsonb_build_array(
      jsonb_build_object('label', 'Helmet', 'value', v_model.name),
      jsonb_build_object('label', 'Helmet size', 'value', v_cfg ->> 'size')
    );

    foreach v_group in array array['route', 'finish', 'base', 'trim', 'spoiler']
    loop
      -- Chrome replaces the base colour, so the base colour is neither priced nor shown.
      if v_group = 'base' and v_cfg ->> 'finish' = 'chrome' then
        v_summary := v_summary || jsonb_build_object('label', v_group_labels ->> v_group, 'value', 'Chrome');
        continue;
      end if;

      select * into v_option
      from public.configurator_options
      where option_group = v_group and value = v_cfg ->> v_group and is_active;
      if not found then
        raise exception 'One of the selected options is no longer available.' using errcode = '22023';
      end if;

      v_unit := v_unit + v_option.price;
      v_summary := v_summary || jsonb_build_object('label', v_group_labels ->> v_group, 'value', v_option.label);
    end loop;

    if v_cfg ->> 'route' = 'new' then
      v_unit := v_unit + v_model.new_helmet_price;
    end if;

    v_summary := v_summary || jsonb_build_object('label', 'Hydro-dip film', 'value', v_film.name);
    v_subtotal := v_subtotal + v_unit * v_qty;

    v_lines := v_lines || jsonb_build_object(
      'product_id', v_product.id,
      'slug', v_product.slug,
      'name', v_product.name,
      'configuration', jsonb_build_object('values', v_cfg, 'summary', v_summary, 'look', v_product.look),
      'unit_price', v_unit,
      'quantity', v_qty
    );
  end loop;

  insert into public.orders (
    user_id, customer_name, customer_email, customer_phone, shipping_address,
    delivery_method, delivery_label, delivery_price, subtotal, total, customer_notes
  )
  values (
    v_user,
    trim(p_customer ->> 'name'),
    lower(trim(p_customer ->> 'email')),
    coalesce(trim(p_customer ->> 'phone'), ''),
    coalesce(p_shipping, '{}'::jsonb),
    p_delivery_method,
    v_delivery ->> 'label',
    v_delivery_price,
    v_subtotal,
    v_subtotal + v_delivery_price,
    left(coalesce(p_notes, ''), 2000)
  )
  returning id, orders.order_number into v_order_id, v_order_number;

  insert into public.order_items (order_id, product_id, product_slug, product_name, configuration, unit_price, quantity, line_total)
  select
    v_order_id,
    (line.value ->> 'product_id')::uuid,
    line.value ->> 'slug',
    line.value ->> 'name',
    line.value -> 'configuration',
    (line.value ->> 'unit_price')::numeric,
    (line.value ->> 'quantity')::integer,
    (line.value ->> 'unit_price')::numeric * (line.value ->> 'quantity')::integer
  from jsonb_array_elements(v_lines) as line(value);

  insert into public.order_status_events (order_id, status, payment_status, note, created_by)
  values (v_order_id, 'pending', 'unpaid', 'Order placed', v_user);

  return query select v_order_id, v_order_number;
end;
$$;

revoke all on function public.place_order(jsonb, jsonb, jsonb, text, text) from public, anon;
grant execute on function public.place_order(jsonb, jsonb, jsonb, text, text) to authenticated;
