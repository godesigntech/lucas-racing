-- Phase 7: MS Kart parts by HydroKarts.
-- Customisable shop products list the finishes they allow (paint, hydro-dip film,
-- chrome) and a customisation fee. The finish is priced from the helmet price list
-- (paint colours, films, chrome, lacquer) inside place_order(), so the browser
-- never sets a price. The parts page stays admin-only until kart_parts_live is on.

alter table public.shop_products
  add column custom_finishes text[] not null default '{}'
    check (custom_finishes <@ array['paint', 'film', 'chrome']::text[]),
  add column custom_fee numeric(10, 2) not null default 0 check (custom_fee >= 0 and custom_fee <= 10000);

alter table public.site_settings
  add column kart_parts_live boolean not null default false;

-- ---------------------------------------------------------------------------
-- Checkout: as migration 1100, plus an optional "finish" on product lines.
-- ---------------------------------------------------------------------------
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
  v_variant public.shop_variants;
  v_shop_product public.shop_products;
  v_store public.stores;
  v_part text;
  v_kind text;
  v_value text;
  v_part_label text;
  v_qty integer;
  v_unit numeric(10, 2);
  v_subtotal numeric(10, 2) := 0;
  v_summary jsonb;
  v_lines jsonb := '[]'::jsonb;
  v_delivery jsonb;
  v_delivery_price numeric(10, 2);
  v_order_id uuid;
  v_order_number text;
  v_text text;
  v_position text;
  v_logo text;
  v_key text;
  v_stock_after integer;
  v_finish jsonb;
  v_parts_live boolean;
  v_part_labels constant jsonb := jsonb_build_object('base', 'Shell', 'graphic', 'Graphic', 'accent', 'Pinstripe');
  v_positions constant jsonb := jsonb_build_object(
    'sides', 'Both sides', 'left', 'Left side', 'right', 'Right side',
    'front', 'Front', 'back', 'Back', 'top', 'Top'
  );
begin
  if v_user is null then
    raise exception 'Please sign in to place an order.' using errcode = '28000';
  end if;

  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your basket is empty.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) > 50 then
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
  select coalesce(s.kart_parts_live, false) into v_parts_live from public.site_settings s where s.id = 1;

  if (v_delivery ->> 'requires_address')::boolean is not false
     and (coalesce(trim(p_shipping ->> 'line1'), '') = '' or coalesce(trim(p_shipping ->> 'postcode'), '') = '') then
    raise exception 'A delivery address is required for this delivery option.' using errcode = '22023';
  end if;

  for v_item in select item.value from jsonb_array_elements(p_items) as item(value)
  loop
    -- Shop products -----------------------------------------------------------
    if v_item ->> 'kind' = 'product' then
      v_qty := coalesce((v_item ->> 'quantity')::integer, 1);
      if v_qty < 1 or v_qty > 99 then
        raise exception 'Quantities must be between 1 and 99.' using errcode = '22023';
      end if;

      select * into v_variant from public.shop_variants
      where id = (v_item ->> 'variant_id')::uuid and is_active
      for update;
      if not found then
        raise exception 'An item in your basket is no longer available.' using errcode = '22023';
      end if;
      select * into v_shop_product from public.shop_products where id = v_variant.product_id and is_active;
      if not found then
        raise exception 'An item in your basket is no longer available.' using errcode = '22023';
      end if;
      select * into v_store from public.stores where id = v_shop_product.store_id;
      if not v_store.purchasable then
        raise exception '% is ordered directly with %.', v_shop_product.title, v_store.name using errcode = '22023';
      end if;

      if v_variant.track_stock and not v_variant.allow_backorder and v_variant.stock_quantity < v_qty then
        if v_variant.stock_quantity <= 0 then
          raise exception '% is out of stock.', v_shop_product.title using errcode = '22023';
        end if;
        raise exception 'Only % of % left in stock.', v_variant.stock_quantity, v_shop_product.title using errcode = '22023';
      end if;

      v_summary := '[]'::jsonb;
      for v_key in select key from jsonb_each_text(v_variant.option_values) order by key
      loop
        v_summary := v_summary || jsonb_build_object('label', v_key, 'value', v_variant.option_values ->> v_key);
      end loop;
      if coalesce(v_variant.sku, '') <> '' then
        v_summary := v_summary || jsonb_build_object('label', 'Part number', 'value', v_variant.sku);
      end if;

      -- Custom finish (MS Kart parts by HydroKarts), priced from the helmet price list:
      --   {"type":"paint","value":"#14254d","lacquer":"gloss"} | {"type":"film","value":"<film id>","lacquer":"satin"} | {"type":"chrome"}
      v_unit := v_variant.price;
      v_finish := v_item -> 'finish';
      if v_shop_product.customisable and cardinality(v_shop_product.custom_finishes) > 0 then
        if not coalesce(v_parts_live, false) and not public.is_admin() then
          raise exception 'Custom parts aren''t available to order yet.' using errcode = '22023';
        end if;
        if v_finish is null or jsonb_typeof(v_finish) <> 'object' then
          raise exception 'Choose a finish for %.', v_shop_product.title using errcode = '22023';
        end if;
        v_kind := v_finish ->> 'type';
        if v_kind is null or not (v_kind = any (v_shop_product.custom_finishes)) then
          raise exception '% isn''t available in that finish.', v_shop_product.title using errcode = '22023';
        end if;
        v_unit := v_unit + v_shop_product.custom_fee;

        if v_kind = 'paint' then
          select * into v_option from public.configurator_options
          where option_group = 'base' and value = v_finish ->> 'value' and is_active;
          if not found then
            raise exception 'The colour you chose is no longer available.' using errcode = '22023';
          end if;
          v_unit := v_unit + v_option.price;
          v_summary := v_summary || jsonb_build_object('label', 'Finish', 'value', 'Paint · ' || v_option.label);
        elsif v_kind = 'film' then
          select * into v_film from public.films where id = v_finish ->> 'value' and is_active and texture_url is not null;
          if not found then
            raise exception 'The hydro-dip film you chose is no longer available.' using errcode = '22023';
          end if;
          v_unit := v_unit + v_film.price;
          v_summary := v_summary || jsonb_build_object('label', 'Finish', 'value', 'Hydro-dip film · ' || v_film.name);
        else
          select * into v_option from public.configurator_options
          where option_group = 'material' and value = 'chrome' and is_active;
          if not found then
            raise exception 'Chrome isn''t available at the moment.' using errcode = '22023';
          end if;
          v_unit := v_unit + v_option.price;
          v_summary := v_summary || jsonb_build_object('label', 'Finish', 'value', v_option.label);
        end if;

        -- Paint and film are lacquered; chrome is not.
        if v_kind in ('paint', 'film') then
          select * into v_option from public.configurator_options
          where option_group = 'finish' and value = v_finish ->> 'lacquer' and is_active;
          if not found then
            raise exception 'Please choose a lacquer for %.', v_shop_product.title using errcode = '22023';
          end if;
          v_unit := v_unit + v_option.price;
          v_summary := v_summary || jsonb_build_object('label', 'Lacquer', 'value', v_option.label);
        end if;

        v_finish := jsonb_build_object(
          'type', v_kind,
          'value', case when v_kind = 'chrome' then 'chrome' else v_finish ->> 'value' end,
          'lacquer', case when v_kind = 'chrome' then '' else v_finish ->> 'lacquer' end
        );
      elsif v_finish is not null and jsonb_typeof(v_finish) <> 'null' then
        raise exception '% can''t be customised.', v_shop_product.title using errcode = '22023';
      else
        v_finish := null;
      end if;

      v_stock_after := null;
      if v_variant.track_stock then
        update public.shop_variants set stock_quantity = stock_quantity - v_qty
        where id = v_variant.id
        returning stock_quantity into v_stock_after;
      end if;

      v_subtotal := v_subtotal + v_unit * v_qty;
      v_lines := v_lines || jsonb_build_object(
        'kind', 'product',
        'store_id', v_shop_product.store_id,
        'variant_id', v_variant.id,
        'stock_after', v_stock_after,
        'slug', v_shop_product.slug,
        'name', v_shop_product.title,
        'configuration', jsonb_build_object(
          'summary', v_summary,
          'image', v_shop_product.images[1],
          'store', v_shop_product.store_id,
          'finish', v_finish
        ),
        'unit_price', v_unit,
        'quantity', v_qty
      );
      continue;
    end if;

    -- Helmet builds (unchanged) ---------------------------------------------------
    v_cfg := v_item -> 'config';
    v_qty := coalesce((v_item ->> 'quantity')::integer, 1);
    if v_qty < 1 or v_qty > 10 then
      raise exception 'Quantities must be between 1 and 10.' using errcode = '22023';
    end if;

    -- The template is the design (product).
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

    -- Helmets are always supplied new.
    v_unit := v_product.base_price + v_model.new_helmet_price;
    v_summary := jsonb_build_array(
      jsonb_build_object('label', 'Helmet', 'value', v_model.name || ' (new)'),
      jsonb_build_object('label', 'Helmet size', 'value', v_cfg ->> 'size'),
      jsonb_build_object('label', 'Template', 'value', v_product.name)
    );

    -- Parts: shell is required; graphic and pinstripe are optional (plain templates have none).
    foreach v_part in array array['base', 'graphic', 'accent']
    loop
      v_kind := v_cfg ->> (v_part || 'Kind');
      v_value := v_cfg ->> v_part;
      v_part_label := v_part_labels ->> v_part;
      if v_kind is null then
        if v_part = 'base' then
          raise exception 'Choose a colour or film for the shell.' using errcode = '22023';
        end if;
        continue;
      end if;

      if v_kind = 'colour' then
        select * into v_option from public.configurator_options
        where option_group = 'base' and value = v_value and is_active;
        if not found then
          raise exception 'One of the colours you chose is no longer available.' using errcode = '22023';
        end if;
        v_unit := v_unit + v_option.price;
        v_summary := v_summary || jsonb_build_object('label', v_part_label, 'value', v_option.label);
      elsif v_kind = 'film' then
        select * into v_film from public.films where id = v_value and is_active and texture_url is not null;
        if not found then
          raise exception 'One of the hydro-dip films you chose is no longer available.' using errcode = '22023';
        end if;
        v_unit := v_unit + v_film.price;
        v_summary := v_summary || jsonb_build_object('label', v_part_label, 'value', 'Film ' || v_film.name);
      elsif v_kind = 'chrome' and v_part = 'base' then
        select * into v_option from public.configurator_options
        where option_group = 'material' and value = 'chrome' and is_active;
        if not found then
          raise exception 'Chrome isn''t available at the moment.' using errcode = '22023';
        end if;
        v_unit := v_unit + v_option.price;
        v_summary := v_summary || jsonb_build_object('label', v_part_label, 'value', v_option.label);
      else
        raise exception 'One of the helmet parts isn''t set up correctly.' using errcode = '22023';
      end if;
    end loop;

    -- Finish, trim and spoiler come from the price list.
    select * into v_option from public.configurator_options where option_group = 'finish' and value = v_cfg ->> 'finish' and is_active;
    if not found then
      raise exception 'Please choose a finish.' using errcode = '22023';
    end if;
    v_unit := v_unit + v_option.price;
    v_summary := v_summary || jsonb_build_object('label', 'Finish', 'value', v_option.label);

    select * into v_option from public.configurator_options where option_group = 'trim' and value = v_cfg ->> 'trim' and is_active;
    if not found then
      raise exception 'Please choose a rubber trim colour.' using errcode = '22023';
    end if;
    v_unit := v_unit + v_option.price;
    v_summary := v_summary || jsonb_build_object('label', 'Rubber trim', 'value', v_option.label);

    select * into v_option from public.configurator_options where option_group = 'spoiler' and value = v_cfg ->> 'spoiler' and is_active;
    if not found then
      raise exception 'Please choose whether you''d like a spoiler.' using errcode = '22023';
    end if;
    v_unit := v_unit + v_option.price;
    v_summary := v_summary || jsonb_build_object('label', 'Rear spoiler', 'value', v_option.label);

    -- Name, race number and logo, each with a position.
    v_text := btrim(coalesce(v_cfg ->> 'riderName', ''));
    if char_length(v_text) > 24 then
      raise exception 'The name on the helmet can be up to 24 characters.' using errcode = '22023';
    end if;
    if v_text <> '' then
      v_position := coalesce(v_positions ->> (v_cfg ->> 'namePosition'), 'Both sides');
      v_summary := v_summary || jsonb_build_object('label', 'Name on helmet', 'value', v_text || ' · ' || v_position);
    end if;

    v_text := btrim(coalesce(v_cfg ->> 'raceNumber', ''));
    if v_text !~ '^[0-9A-Za-z]{0,3}$' then
      raise exception 'Race numbers can be up to 3 letters or digits.' using errcode = '22023';
    end if;
    if v_text <> '' then
      v_position := coalesce(v_positions ->> (v_cfg ->> 'numberPosition'), 'Both sides');
      v_summary := v_summary || jsonb_build_object('label', 'Race number', 'value', v_text || ' · ' || v_position);
    end if;

    v_logo := nullif(btrim(coalesce(v_cfg ->> 'logo', '')), '');
    if v_logo is not null then
      if v_logo !~ ('^' || v_user::text || '/[0-9a-f-]{36}\.(png|jpg|webp)$')
         or not exists (select 1 from storage.objects o where o.bucket_id = 'design-logos' and o.name = v_logo) then
        raise exception 'Your logo didn''t upload. Please add it again.' using errcode = '22023';
      end if;
      v_position := coalesce(v_positions ->> (v_cfg ->> 'logoPosition'), 'Back');
      v_summary := v_summary || jsonb_build_object('label', 'Logo', 'value', 'Uploaded · ' || v_position);
    end if;

    v_subtotal := v_subtotal + v_unit * v_qty;

    v_lines := v_lines || jsonb_build_object(
      'kind', 'helmet',
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

  insert into public.order_items (
    order_id, line_kind, store_id, product_id, shop_variant_id, product_slug, product_name,
    configuration, unit_price, quantity, line_total
  )
  select
    v_order_id,
    line.value ->> 'kind',
    line.value ->> 'store_id',
    (line.value ->> 'product_id')::uuid,
    (line.value ->> 'variant_id')::uuid,
    line.value ->> 'slug',
    line.value ->> 'name',
    line.value -> 'configuration',
    (line.value ->> 'unit_price')::numeric,
    (line.value ->> 'quantity')::integer,
    (line.value ->> 'unit_price')::numeric * (line.value ->> 'quantity')::integer
  from jsonb_array_elements(v_lines) as line(value);

  -- Stock audit trail for the products just sold.
  insert into public.inventory_movements (variant_id, change, quantity_after, reason, order_id, note, created_by)
  select
    (line.value ->> 'variant_id')::uuid,
    -((line.value ->> 'quantity')::integer),
    (line.value ->> 'stock_after')::integer,
    'order',
    v_order_id,
    'Order ' || v_order_number,
    v_user
  from jsonb_array_elements(v_lines) as line(value)
  where line.value ->> 'kind' = 'product' and line.value ->> 'stock_after' is not null;

  insert into public.order_status_events (order_id, status, payment_status, note, created_by)
  values (v_order_id, 'pending', 'unpaid', 'Order placed', v_user);

  return query select v_order_id, v_order_number;
end;
$$;

revoke all on function public.place_order(jsonb, jsonb, jsonb, text, text) from public, anon;
grant execute on function public.place_order(jsonb, jsonb, jsonb, text, text) to authenticated;
