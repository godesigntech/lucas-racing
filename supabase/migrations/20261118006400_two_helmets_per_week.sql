-- The workshop takes 2 helmets a week for now (client, 18 Nov 2026). Weeks with their own
-- capacity in production_capacity keep it; there are none at the moment.
update public.production_settings set weekly_capacity = 2 where id = 1;
