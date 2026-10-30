-- Own-helmet requests. A customer who sends their own helmet doesn't use the 3D
-- builder: they describe the job with photos and their choices (paint finishes,
-- films, lacquer, text, logos) and the workshop replies with a quote. These live
-- with the other quote requests so admins handle them in one place.

alter table public.quote_requests
  add column kind text not null default 'design' check (kind in ('design', 'own_helmet')),
  add column photo_paths text[] not null default '{}',
  add column details jsonb not null default '{}';

-- The only way to create an own-helmet request. The customer must be signed in with
-- a complete profile (name, phone, address) so the workshop can always reach them;
-- their contact details come from that profile, not from the form.
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

  -- Choices: a small JSON object. Logos must be the customer's own uploads.
  if jsonb_typeof(coalesce(p_details, '{}'::jsonb)) <> 'object' or pg_column_size(coalesce(p_details, '{}'::jsonb)) > 8000 then
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
