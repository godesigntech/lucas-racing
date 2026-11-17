-- Client requests, 17 Nov 2026.
--
-- 1. A notice across the top of every page (Admin > Settings > Launches), switched on with
--    the testing message: the site is live for the competition, payments aren't taken yet.
-- 2. Instagram: the team is @ms.lucasracing, and HydroKarts is @hydro.karts (both shown).
-- 3. Messages go to a team: Lucas Racing (karts, parts, teamwear) or HydroKarts (helmets
--    and customisation), as different people answer them.
-- 4. Kart sticker designs remember the number's background colour (it depends on the
--    driver's class).

alter table public.site_settings
  add column if not exists site_notice text not null default '',
  add column if not exists show_site_notice boolean not null default false;

update public.site_settings
set
  site_notice = 'Our website is live for the helmet design competition but is still being tested, so no payments are taken yet. You can design your helmet and ask for a quote. Spotted a problem? Please let us know. Good luck in the competition!',
  show_site_notice = true
where id = 1;

-- Every Instagram link becomes the team's own account, then HydroKarts' is added once.
update public.site_settings
set social_links = (
  select coalesce(jsonb_agg(
    case when link ->> 'icon' = 'instagram'
      then jsonb_build_object('label', 'Lucas Racing on Instagram', 'icon', 'instagram', 'href', 'https://www.instagram.com/ms.lucasracing')
      else link end
    order by ordinality
  ), '[]'::jsonb)
  from jsonb_array_elements(social_links) with ordinality as entries(link, ordinality)
)
where id = 1;

update public.site_settings
set social_links = social_links || jsonb_build_array(
  jsonb_build_object('label', 'HydroKarts on Instagram', 'icon', 'instagram', 'href', 'https://www.instagram.com/hydro.karts')
)
where id = 1
  and not exists (select 1 from jsonb_array_elements(social_links) link where link ->> 'href' ilike '%instagram.com/hydro.karts%');

-- If the team's own link wasn't there at all, it's added too.
update public.site_settings
set social_links = jsonb_build_array(
  jsonb_build_object('label', 'Lucas Racing on Instagram', 'icon', 'instagram', 'href', 'https://www.instagram.com/ms.lucasracing')
) || social_links
where id = 1
  and not exists (select 1 from jsonb_array_elements(social_links) link where link ->> 'href' ilike '%instagram.com/ms.lucasracing%');

alter table public.conversations
  add column if not exists department text not null default 'lucas'
    check (department in ('lucas', 'hydrokarts'));

alter table public.kart_sticker_designs
  add column if not exists number_background text not null default '';

-- Kart sticker requests carry the number background to the workshop (Admin > Quotes).
create or replace function public.submit_kart_sticker_request(p_design uuid, p_notes text)
returns table (reference text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_profile public.profiles;
  v_design public.kart_sticker_designs;
  v_recent integer;
begin
  if v_user is null then
    raise exception 'Please log in to send your design.' using errcode = '28000';
  end if;
  select * into v_profile from public.profiles where id = v_user;
  if not found then
    raise exception 'Please log in to send your design.' using errcode = '28000';
  end if;

  select * into v_design from public.kart_sticker_designs d where d.id = p_design and d.user_id = v_user;
  if not found then
    raise exception 'That design couldn''t be found. Please make it again.' using errcode = '22023';
  end if;
  if char_length(coalesce(p_notes, '')) > 2000 then
    raise exception 'Please keep your notes under 2,000 characters.' using errcode = '22023';
  end if;

  select count(*) into v_recent
  from public.quote_requests q
  where q.user_id = v_user and q.kind = 'kart_stickers' and q.created_at > now() - interval '1 hour';
  if v_recent >= 5 then
    raise exception 'You''ve sent a few designs in the last hour. We''ll be in touch soon.' using errcode = '22023';
  end if;

  return query
  insert into public.quote_requests (user_id, name, email, phone, helmet, notes, image_path, kind, details)
  values (
    v_user,
    coalesce(nullif(btrim(v_profile.full_name), ''), split_part(v_profile.email, '@', 1)),
    lower(btrim(v_profile.email)),
    btrim(coalesce(v_profile.phone, '')),
    'kart',
    btrim(coalesce(p_notes, '')),
    v_design.image_path,
    'kart_stickers',
    jsonb_build_object(
      'designId', v_design.id,
      'layout', v_design.layout,
      'kartModel', v_design.kart_model,
      'prompt', v_design.prompt,
      'raceNumber', v_design.race_number,
      'driverName', v_design.driver_name,
      'numberBackground', v_design.number_background,
      'finish', v_design.finish,
      'logos', to_jsonb(v_design.logos)
    )
  )
  returning quote_requests.reference;
end;
$$;
