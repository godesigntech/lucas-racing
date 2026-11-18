-- Client answers, 18 Nov 2026.
--
-- 1. Checkout can be switched off (Admin > Settings > Launches): until prices and product
--    images are confirmed, the basket asks for a quote instead of taking orders.
-- 2. A second WhatsApp number, one per team: the button lets customers choose.
-- 3. Competition: stories and posts both count.

alter table public.site_settings
  add column if not exists checkout_enabled boolean not null default true;

update public.site_settings set checkout_enabled = false where id = 1;

-- The existing number becomes Lucas Racing's; HydroKarts' is added once.
update public.site_settings
set social_links = (
  select coalesce(jsonb_agg(
    case when link ->> 'href' = 'https://wa.me/447496236784'
      then jsonb_build_object('label', 'Lucas Racing', 'icon', 'whatsapp', 'href', 'https://wa.me/447496236784')
      else link end
    order by ordinality
  ), '[]'::jsonb)
  from jsonb_array_elements(social_links) with ordinality as entries(link, ordinality)
)
where id = 1;

update public.site_settings
set social_links = social_links || jsonb_build_array(
  jsonb_build_object('label', 'HydroKarts', 'icon', 'whatsapp', 'href', 'https://wa.me/447999975755')
)
where id = 1
  and not exists (select 1 from jsonb_array_elements(social_links) link where link ->> 'href' = 'https://wa.me/447999975755');

update public.competitions
set rules = (
  select array_agg(
    case when rule ilike '%Disappearing stories don''t count%'
      then 'Share your finished design on your story or in a post from your own account, and tag both Lucas Racing (@ms.lucasracing) and HydroKarts (@hydro.karts). Stories and posts both count. If you share a post, keep it visible until the winner is announced.'
      else rule end
    order by ordinality
  )
  from unnest(rules) with ordinality as entries(rule, ordinality)
)
where exists (select 1 from unnest(rules) rule where rule ilike '%Disappearing stories don''t count%');
