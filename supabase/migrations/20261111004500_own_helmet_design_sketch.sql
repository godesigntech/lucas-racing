-- Own-helmet requests can carry a 3D sketch: the customer plays with the builder on the
-- request page (no prices, no helmet choice) and the design is sent as a reference, with
-- pictures of it from four sides. It goes in details.design as
-- { slug, name, config, summary, images }, so details can be much bigger than before.

create or replace function public.submit_own_helmet_request(
  p_notes text,
  p_photo_paths text[],
  p_details jsonb
)
returns table (reference text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_profile public.profiles;
  v_photo text;
  v_logo text;
  v_recent integer;
  v_design jsonb := p_details -> 'design';
  v_path text;
begin
  if v_user is null then
    raise exception 'Please log in to send your request.' using errcode = '28000';
  end if;

  select * into v_profile from public.profiles where id = v_user;
  if not found
    or char_length(btrim(coalesce(v_profile.full_name, ''))) < 2
    or btrim(coalesce(v_profile.phone, '')) = ''
    or btrim(coalesce(v_profile.address_line1, '')) = ''
    or btrim(coalesce(v_profile.city, '')) = ''
    or btrim(coalesce(v_profile.postcode, '')) = '' then
    raise exception 'Please add your name, phone number and address first.' using errcode = '22023';
  end if;

  if char_length(btrim(coalesce(p_notes, ''))) not between 10 and 2000 then
    raise exception 'Tell us about the design you would like (at least a sentence).' using errcode = '22023';
  end if;

  -- Photos of their helmet: 1 to 6, uploaded to the private design-uploads bucket.
  if cardinality(coalesce(p_photo_paths, '{}')) not between 1 and 6 then
    raise exception 'Add between 1 and 6 photos of your helmet.' using errcode = '22023';
  end if;
  foreach v_photo in array p_photo_paths loop
    if v_photo !~ '^quotes/[0-9a-f-]{36}\.(jpg|png|webp)$'
      or not exists (select 1 from storage.objects o where o.bucket_id = 'design-uploads' and o.name = v_photo) then
      raise exception 'One of your photos didn''t upload. Please add it again.' using errcode = '22023';
    end if;
  end loop;

  -- Choices: a JSON object (bigger now it can hold a 3D sketch). Logos must be the customer's own uploads.
  if jsonb_typeof(coalesce(p_details, '{}'::jsonb)) <> 'object' or pg_column_size(coalesce(p_details, '{}'::jsonb)) > 200000 then
    raise exception 'That request couldn''t be saved.' using errcode = '22023';
  end if;
  if jsonb_typeof(p_details -> 'logos') = 'array' then
    if jsonb_array_length(p_details -> 'logos') > 6 then
      raise exception 'Add up to 6 logos.' using errcode = '22023';
    end if;
    for v_logo in select jsonb_array_elements_text(p_details -> 'logos') loop
      if v_logo !~ ('^' || v_user::text || '/[0-9a-f-]{36}\.(png|jpg|webp)$')
        or not exists (select 1 from storage.objects o where o.bucket_id = 'design-logos' and o.name = v_logo) then
        raise exception 'One of your logos didn''t upload. Please add it again.' using errcode = '22023';
      end if;
    end loop;
  end if;

  -- The 3D sketch: a template, its design, and up to four pictures of it.
  if v_design is not null then
    if jsonb_typeof(v_design) <> 'object'
      or jsonb_typeof(v_design -> 'config') <> 'object'
      or coalesce(v_design ->> 'slug', '') !~ '^[a-z0-9-]{1,80}$'
      or jsonb_typeof(coalesce(v_design -> 'images', '[]'::jsonb)) <> 'array'
      or jsonb_array_length(coalesce(v_design -> 'images', '[]'::jsonb)) > 4 then
      raise exception 'Your 3D sketch couldn''t be sent. Please try again.' using errcode = '22023';
    end if;
    for v_path in select jsonb_array_elements_text(coalesce(v_design -> 'images', '[]'::jsonb)) loop
      if v_path !~ '^quotes/[0-9a-f-]{36}\.(jpg|png|webp)$'
        or not exists (select 1 from storage.objects o where o.bucket_id = 'design-uploads' and o.name = v_path) then
        raise exception 'The pictures of your 3D sketch didn''t upload. Please try again.' using errcode = '22023';
      end if;
    end loop;
    -- Images and prints in the sketch must be the customer's own uploads, as for builds.
    for v_path in
      select logo ->> 'path' from jsonb_array_elements(case when jsonb_typeof(v_design -> 'config' -> 'logos') = 'array' then v_design -> 'config' -> 'logos' else '[]'::jsonb end) logo
      union all
      select region.value ->> 'print' from jsonb_each(case when jsonb_typeof(v_design -> 'config' -> 'regions') = 'object' then v_design -> 'config' -> 'regions' else '{}'::jsonb end) region
    loop
      continue when v_path is null;
      if v_path !~ ('^' || v_user::text || '/[0-9a-f-]{36}\.(png|jpg|webp)$')
        or not exists (select 1 from storage.objects o where o.bucket_id = 'design-logos' and o.name = v_path) then
        raise exception 'One of the images in your 3D sketch didn''t upload. Please add it again.' using errcode = '22023';
      end if;
    end loop;
  end if;

  -- Keep the form from being used to flood the workshop.
  select count(*) into v_recent
  from public.quote_requests q
  where q.user_id = v_user and q.kind = 'own_helmet' and q.created_at > now() - interval '1 hour';
  if v_recent >= 3 then
    raise exception 'You''ve sent a few requests in the last hour. We''ll be in touch soon.' using errcode = '22023';
  end if;

  return query
  insert into public.quote_requests (user_id, name, email, phone, helmet, notes, image_path, kind, photo_paths, details)
  values (
    v_user,
    btrim(v_profile.full_name),
    lower(btrim(v_profile.email)),
    btrim(v_profile.phone),
    'own',
    btrim(p_notes),
    p_photo_paths[1],
    'own_helmet',
    p_photo_paths,
    coalesce(p_details, '{}'::jsonb)
  )
  returning quote_requests.reference;
end;
$$;

revoke all on function public.submit_own_helmet_request(text, text[], jsonb) from public;
grant execute on function public.submit_own_helmet_request(text, text[], jsonb) to authenticated;
