-- The 3D artist's new Bell KC7 model has a second spoiler kit. Its price is a placeholder
-- until the client confirms it (admin, Helmet builder → Aero).
insert into public.aero_kits (id, model_id, name, summary, mesh_name, price, is_active, sort_order)
values ('bell-kc7-top-spoiler', 'bell-kc7', 'Top spoiler', 'Clear aero panels across the top of the helmet.', 'Spoiler_Top', 45, true, 3)
on conflict (id) do nothing;
