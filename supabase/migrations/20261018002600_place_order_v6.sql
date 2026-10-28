-- Phase 8: checkout for the 16-step builder.
--
-- As migration 1500, plus:
--   * route — the customer may send their own helmet, so the new-helmet price is only
--     added when they want one (step 1);
--   * per-size pricing from helmet_model_sizes (step 1);
--   * aero kits (step 2);
--   * per-region treatments driven by template_regions, so a template can have any number
--     of editable areas and pinstripes rather than the hard-coded three (steps 3-7);
--   * metallic as well as chrome, with the rule that either forces a gloss lacquer (step 8);
--   * initials, flags and free text alongside name and number (step 9);
--   * several sponsor logos instead of one (step 10);
--   * visors and visor strips (steps 12-13);
--   * a booked production slot and any rush fee (step 15).
--
-- Two rules run through all of it:
--   * the browser never sends a price; every figure is read from the database here;
--   * an option whose price is null has not been agreed with the client yet, so it is
--     previewable but unsellable, and checkout stops with a message naming it.
--
-- The old flat config (base/graphic/accent) is still accepted, so baskets, saved designs
-- and share links created before this migration keep working.

drop function if exists public.place_order(jsonb, jsonb, jsonb, text, text);

create or replace function public.place_order(
  p_items jsonb,
  p_customer jsonb,
  p_shipping jsonb,
  p_delivery_method text,
  p_notes text default '',
  p_production jsonb default '{}'::jsonb
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
  v_template public.design_templates;
  v_region public.template_regions;
  v_aero public.aero_kits;
  v_visor public.visors;
  v_tier public.production_rush_tiers;
  v_settings public.production_settings;
  v_size_price numeric(10, 2);
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
  v_regions jsonb;
  v_entry jsonb;
  v_person jsonb;
  v_logo_item jsonb;
  v_requires_gloss boolean;
  v_region_count integer;
  v_helmets integer := 0;
  v_rush_fee numeric(10, 2) := 0;
  v_tier_key text;
  v_start_date date;
  v_completion date;
  v_route text;
  v_part_labels constant jsonb := jsonb_build_object('base', 'Shell', 'graphic', 'Graphic', 'accent', 'Pinstripe');
  v_person_labels constant jsonb := jsonb_build_object(
    'name', 'Name on helmet', 'number', 'Race number', 'initials', 'Initials',
    'flag', 'National flag', 'text', 'Custom text'
  );
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
          if v_option.price is null then
            raise exception '% is priced on request. Please ask us to confirm it before ordering.', v_option.label using errcode = '22023';
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
          if v_option.price is null then
            raise exception 'Chrome is priced on request. Please ask us to confirm it before ordering.' using errcode = '22023';
          end if;
          v_unit := v_unit + v_option.price;
          v_summary := v_summary || jsonb_build_object('label', 'Finish', 'value', v_option.label);
        end if;

        if v_kind in ('paint', 'film') then
          select * into v_option from public.configurator_options
          where option_group = 'finish' and value = v_finish ->> 'lacquer' and is_active;
          if not found then
            raise exception 'Please choose a lacquer for %.', v_shop_product.title using errcode = '22023';
          end if;
          if v_option.price is null then
            raise exception '% is priced on request. Please ask us to confirm it before ordering.', v_option.label using errcode = '22023';
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

    -- Helmet builds -----------------------------------------------------------
    v_cfg := v_item -> 'config';
    v_qty := coalesce((v_item ->> 'quantity')::integer, 1);
    if v_qty < 1 or v_qty > 10 then
      raise exception 'Quantities must be between 1 and 10.' using errcode = '22023';
    end if;
    v_helmets := v_helmets + v_qty;
    v_requires_gloss := false;

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

    -- Size: priced from helmet_model_sizes when the model lists its sizes there.
    select s.price into v_size_price
    from public.helmet_model_sizes s
    where s.model_id = v_model.id and s.size = v_cfg ->> 'size' and s.is_active;
    if found then
      if v_size_price is null then
        raise exception 'Size % is priced on request. Please ask us to confirm it before ordering.', v_cfg ->> 'size' using errcode = '22023';
      end if;
    else
      if not ((v_cfg ->> 'size') = any (v_model.sizes)) then
        raise exception 'Please choose a valid helmet size.' using errcode = '22023';
      end if;
      v_size_price := 0;
    end if;

    -- Route: a new helmet from us, or the customer's own shell.
    v_route := coalesce(nullif(btrim(coalesce(v_cfg ->> 'route', '')), ''), 'new');
    select * into v_option from public.configurator_options
    where option_group = 'route' and value = v_route and is_active;
    if not found then
      raise exception 'Please choose whether we supply the helmet.' using errcode = '22023';
    end if;
    if v_option.price is null then
      raise exception '% is priced on request. Please ask us to confirm it before ordering.', v_option.label using errcode = '22023';
    end if;

    v_unit := v_product.base_price + v_option.price + v_size_price;
    if v_route = 'new' then
      v_unit := v_unit + v_model.new_helmet_price;
    end if;

    v_summary := jsonb_build_array(
      jsonb_build_object('label', 'Helmet', 'value', v_model.name || case when v_route = 'new' then ' (new)' else ' (your own shell)' end),
      jsonb_build_object('label', 'Helmet size', 'value', v_cfg ->> 'size'),
      jsonb_build_object('label', 'Template', 'value', v_product.name)
    );

    -- Aero kit (step 2). Older builds carry a yes/no spoiler instead.
    if v_cfg ? 'aero' and coalesce(btrim(v_cfg ->> 'aero'), '') <> '' then
      select * into v_aero from public.aero_kits
      where id = v_cfg ->> 'aero' and model_id = v_model.id and is_active;
      if not found then
        raise exception 'That aero kit isn''t available on this helmet.' using errcode = '22023';
      end if;
      if v_aero.price is null then
        raise exception '% is priced on request. Please ask us to confirm it before ordering.', v_aero.name using errcode = '22023';
      end if;
      v_unit := v_unit + v_aero.price;
      v_summary := v_summary || jsonb_build_object('label', 'Aero kit', 'value', v_aero.name);
    else
      select * into v_option from public.configurator_options where option_group = 'spoiler' and value = v_cfg ->> 'spoiler' and is_active;
      if not found then
        raise exception 'Please choose whether you''d like a spoiler.' using errcode = '22023';
      end if;
      if v_option.price is null then
        raise exception '% is priced on request. Please ask us to confirm it before ordering.', v_option.label using errcode = '22023';
      end if;
      v_unit := v_unit + v_option.price;
      v_summary := v_summary || jsonb_build_object('label', 'Rear spoiler', 'value', v_option.label);
    end if;

    -- Design regions (steps 4-7) ----------------------------------------------
    v_regions := v_cfg -> 'regions';
    v_region_count := 0;
    if v_regions is not null and jsonb_typeof(v_regions) = 'object' then
      select * into v_template from public.design_templates
      where product_slug = v_product.slug and model_id = v_model.id and is_active;
      if found then
        for v_region in
          select * from public.template_regions r where r.template_id = v_template.id order by r.sort_order
        loop
          v_region_count := v_region_count + 1;
          v_entry := v_regions -> v_region.key;
          if v_entry is null or jsonb_typeof(v_entry) <> 'object' then
            if v_region.key = 'base' then
              raise exception 'Choose a colour or film for the shell.' using errcode = '22023';
            end if;
            continue;
          end if;

          v_kind := v_entry ->> 'kind';
          v_value := v_entry ->> 'value';

          if v_kind = 'colour' then
            select * into v_option from public.configurator_options
            where option_group = 'base' and value = v_value and is_active;
            if not found then
              raise exception 'One of the colours you chose is no longer available.' using errcode = '22023';
            end if;
            if v_option.price is null then
              raise exception '% is priced on request. Please ask us to confirm it before ordering.', v_option.label using errcode = '22023';
            end if;
            v_unit := v_unit + v_option.price;
            v_summary := v_summary || jsonb_build_object('label', v_region.label, 'value', v_option.label);

          elsif v_kind = 'film' then
            if not v_region.allows_film then
              raise exception 'A hydro-dip film can''t be applied to the %.', lower(v_region.label) using errcode = '22023';
            end if;
            select * into v_film from public.films where id = v_value and is_active and texture_url is not null;
            if not found then
              raise exception 'One of the hydro-dip films you chose is no longer available.' using errcode = '22023';
            end if;
            v_unit := v_unit + v_film.price;
            v_summary := v_summary || jsonb_build_object('label', v_region.label, 'value', 'Film ' || v_film.name);

          elsif v_kind in ('chrome', 'metallic') then
            if v_kind = 'chrome' and not v_region.allows_chrome then
              raise exception 'Chrome can''t be applied to the %.', lower(v_region.label) using errcode = '22023';
            end if;
            if v_kind = 'metallic' and not v_region.allows_metallic then
              raise exception 'Metallic paint can''t be applied to the %.', lower(v_region.label) using errcode = '22023';
            end if;
            select * into v_option from public.configurator_options
            where option_group = 'material' and value = v_kind and is_active;
            if not found then
              raise exception 'That paint finish isn''t available at the moment.' using errcode = '22023';
            end if;
            if v_option.price is null then
              raise exception '% paint is priced on request. Please ask us to confirm it before ordering.', v_option.label using errcode = '22023';
            end if;
            v_unit := v_unit + v_option.price;
            v_requires_gloss := true;
            v_summary := v_summary || jsonb_build_object('label', v_region.label, 'value', v_option.label);

          else
            raise exception 'One of the helmet parts isn''t set up correctly.' using errcode = '22023';
          end if;
        end loop;
      end if;
    end if;

    -- Older builds, and templates with no regions recorded yet.
    if v_region_count = 0 then
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
          if v_option.price is null then
            raise exception '% is priced on request. Please ask us to confirm it before ordering.', v_option.label using errcode = '22023';
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
        elsif v_kind in ('chrome', 'metallic') and v_part = 'base' then
          select * into v_option from public.configurator_options
          where option_group = 'material' and value = v_kind and is_active;
          if not found then
            raise exception 'That paint finish isn''t available at the moment.' using errcode = '22023';
          end if;
          if v_option.price is null then
            raise exception '% paint is priced on request. Please ask us to confirm it before ordering.', v_option.label using errcode = '22023';
          end if;
          v_unit := v_unit + v_option.price;
          v_requires_gloss := true;
          v_summary := v_summary || jsonb_build_object('label', v_part_label, 'value', v_option.label);
        else
          raise exception 'One of the helmet parts isn''t set up correctly.' using errcode = '22023';
        end if;
      end loop;
    end if;

    -- Overall finish (step 8). Metallic and chrome are lacquered gloss.
    select * into v_option from public.configurator_options where option_group = 'finish' and value = v_cfg ->> 'finish' and is_active;
    if not found then
      raise exception 'Please choose a finish.' using errcode = '22023';
    end if;
    if v_requires_gloss and v_option.value <> 'gloss' then
      raise exception 'Metallic and chrome paint are finished in gloss. Please choose gloss, or change those sections.' using errcode = '22023';
    end if;
    if v_option.price is null then
      raise exception '% is priced on request. Please ask us to confirm it before ordering.', v_option.label using errcode = '22023';
    end if;
    v_unit := v_unit + v_option.price;
    v_summary := v_summary || jsonb_build_object('label', 'Finish', 'value', v_option.label);

    select * into v_option from public.configurator_options where option_group = 'trim' and value = v_cfg ->> 'trim' and is_active;
    if not found then
      raise exception 'Please choose a rubber trim colour.' using errcode = '22023';
    end if;
    if v_option.price is null then
      raise exception '% is priced on request. Please ask us to confirm it before ordering.', v_option.label using errcode = '22023';
    end if;
    v_unit := v_unit + v_option.price;
    v_summary := v_summary || jsonb_build_object('label', 'Rubber trim', 'value', v_option.label);

    -- Visor (step 12).
    if v_cfg ? 'visor' and coalesce(btrim(v_cfg ->> 'visor'), '') <> '' then
      select * into v_visor from public.visors
      where id = v_cfg ->> 'visor' and model_id = v_model.id and is_active;
      if not found then
        raise exception 'That visor isn''t available on this helmet.' using errcode = '22023';
      end if;
      if v_visor.price is null then
        raise exception 'The % visor is priced on request. Please ask us to confirm it before ordering.', lower(v_visor.name) using errcode = '22023';
      end if;
      v_unit := v_unit + v_visor.price;
      v_summary := v_summary || jsonb_build_object('label', 'Visor', 'value', v_visor.name);
    end if;

    -- Visor strip (step 13).
    v_entry := v_cfg -> 'visorStrip';
    if v_entry is not null and jsonb_typeof(v_entry) = 'object' and coalesce((v_entry ->> 'enabled')::boolean, false) then
      v_text := btrim(coalesce(v_entry ->> 'text', ''));
      if char_length(v_text) > 40 then
        raise exception 'Visor strip text can be up to 40 characters.' using errcode = '22023';
      end if;
      select * into v_option from public.configurator_options
      where option_group = 'visor_strip' and value = 'printed' and is_active;
      if not found then
        raise exception 'Visor strips aren''t available at the moment.' using errcode = '22023';
      end if;
      if v_option.price is null then
        raise exception 'The visor strip is priced on request. Please ask us to confirm it before ordering.' using errcode = '22023';
      end if;
      v_unit := v_unit + v_option.price;
      v_summary := v_summary || jsonb_build_object('label', 'Visor strip', 'value', coalesce(nullif(v_text, ''), 'Plain'));
    end if;

    -- Personalisation (step 9). Older builds carry riderName / raceNumber instead.
    v_entry := v_cfg -> 'personalisation';
    if v_entry is not null and jsonb_typeof(v_entry) = 'array' then
      if jsonb_array_length(v_entry) > 6 then
        raise exception 'You can add up to 6 pieces of personalisation.' using errcode = '22023';
      end if;
      for v_person in select p.value from jsonb_array_elements(v_entry) as p(value)
      loop
        v_kind := v_person ->> 'kind';
        v_text := btrim(coalesce(v_person ->> 'value', ''));
        if v_text = '' then
          continue;
        end if;
        if v_kind = 'number' and v_text !~ '^[0-9A-Za-z]{1,3}$' then
          raise exception 'Race numbers can be up to 3 letters or digits.' using errcode = '22023';
        elsif v_kind = 'initials' and v_text !~ '^[A-Za-z]{1,3}$' then
          raise exception 'Initials can be up to 3 letters.' using errcode = '22023';
        elsif v_kind = 'flag' and v_text !~ '^[A-Za-z]{2,3}$' then
          raise exception 'Please choose a country for the flag.' using errcode = '22023';
        elsif v_kind in ('name', 'text') and char_length(v_text) > 24 then
          raise exception 'Text on the helmet can be up to 24 characters.' using errcode = '22023';
        end if;

        select * into v_option from public.configurator_options
        where option_group = 'personalisation' and value = v_kind and is_active;
        if not found then
          raise exception 'That personalisation isn''t available at the moment.' using errcode = '22023';
        end if;
        if v_option.price is null then
          raise exception '% is priced on request. Please ask us to confirm it before ordering.', v_option.label using errcode = '22023';
        end if;
        v_unit := v_unit + v_option.price;
        v_position := coalesce(v_positions ->> (v_person ->> 'position'), 'Both sides');
        v_summary := v_summary || jsonb_build_object(
          'label', coalesce(v_person_labels ->> v_kind, 'Personalisation'),
          'value', v_text || ' · ' || v_position
        );
      end loop;
    else
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
    end if;

    -- Sponsor and team logos (step 10). Each must really be in the customer's folder.
    v_entry := v_cfg -> 'logos';
    if v_entry is not null and jsonb_typeof(v_entry) = 'array' then
      if jsonb_array_length(v_entry) > 4 then
        raise exception 'You can add up to 4 logos.' using errcode = '22023';
      end if;
      for v_logo_item in select l.value from jsonb_array_elements(v_entry) as l(value)
      loop
        v_logo := nullif(btrim(coalesce(v_logo_item ->> 'path', '')), '');
        if v_logo is null then
          continue;
        end if;
        if v_logo !~ ('^' || v_user::text || '/[0-9a-f-]{36}\.(png|jpg|webp)$')
           or not exists (select 1 from storage.objects o where o.bucket_id = 'design-logos' and o.name = v_logo) then
          raise exception 'One of your logos didn''t upload. Please add it again.' using errcode = '22023';
        end if;
        v_position := coalesce(v_positions ->> (v_logo_item ->> 'position'), 'Back');
        v_summary := v_summary || jsonb_build_object('label', 'Logo', 'value', 'Uploaded · ' || v_position);
      end loop;
    else
      v_logo := nullif(btrim(coalesce(v_cfg ->> 'logo', '')), '');
      if v_logo is not null then
        if v_logo !~ ('^' || v_user::text || '/[0-9a-f-]{36}\.(png|jpg|webp)$')
           or not exists (select 1 from storage.objects o where o.bucket_id = 'design-logos' and o.name = v_logo) then
          raise exception 'Your logo didn''t upload. Please add it again.' using errcode = '22023';
        end if;
        v_position := coalesce(v_positions ->> (v_cfg ->> 'logoPosition'), 'Back');
        v_summary := v_summary || jsonb_build_object('label', 'Logo', 'value', 'Uploaded · ' || v_position);
      end if;
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

  -- Production slot and rush fee (step 15) ------------------------------------
  -- Only helmet builds go through the workshop; a parts-only order ships from stock.
  if v_helmets > 0 then
    select * into v_settings from public.production_settings where id = 1;
    v_tier_key := coalesce(nullif(btrim(coalesce(p_production ->> 'rush_tier', '')), ''), 'standard');

    select * into v_tier from public.production_rush_tiers where key = v_tier_key;
    if not found or not v_tier.is_active then
      raise exception 'That turnaround is not available.' using errcode = '22023';
    end if;
    if v_tier.key <> 'standard' and not coalesce(v_settings.rush_enabled, false) then
      raise exception 'Rush orders are not available at the moment.' using errcode = '22023';
    end if;
    if v_tier.fee is null then
      raise exception '% is priced on request. Please contact us to book it.', v_tier.label using errcode = '22023';
    end if;
    v_rush_fee := v_tier.fee;

    begin
      v_start_date := (p_production ->> 'start_date')::date;
    exception when others then
      raise exception 'Please choose when you would like production to start.' using errcode = '22023';
    end;

    -- A basket placed before the calendar existed, or a client that didn't send a date,
    -- takes the first week the workshop can actually start. The customer sees the date
    -- on their order and we confirm it with their proof.
    if v_start_date is null then
      select a.week_start into v_start_date
      from public.production_availability(null) a
      where a.is_bookable
      order by a.week_start
      limit 1;
      if v_start_date is null then
        raise exception 'We have no production dates free at the moment. Please contact us to book your helmet.' using errcode = '22023';
      end if;
    end if;
  end if;

  insert into public.orders (
    user_id, customer_name, customer_email, customer_phone, shipping_address,
    delivery_method, delivery_label, delivery_price, subtotal, total, customer_notes,
    production_start_date, rush_tier, rush_fee
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
    v_subtotal + v_delivery_price + v_rush_fee,
    left(coalesce(p_notes, ''), 2000),
    v_start_date,
    case when v_helmets > 0 then v_tier_key else null end,
    v_rush_fee
  )
  returning id, orders.order_number into v_order_id, v_order_number;

  -- Takes the slot under an advisory lock, so two checkouts can't share the last one.
  if v_helmets > 0 then
    v_completion := public.book_production_slot(v_order_id, v_start_date, v_tier_key, v_helmets);
    update public.orders set estimated_completion_date = v_completion where id = v_order_id;
  end if;

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

revoke all on function public.place_order(jsonb, jsonb, jsonb, text, text, jsonb) from public, anon;
grant execute on function public.place_order(jsonb, jsonb, jsonb, text, text, jsonb) to authenticated;
