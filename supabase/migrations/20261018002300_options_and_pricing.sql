-- Phase 8: the 16-step helmet journey, part 2 of 4 — the things customers can choose.
--
-- Adds the catalogue entities the new steps need (aero kits, visors, per-size pricing)
-- and introduces "price on request" as a first-class state.
--
-- Pricing rule introduced here: configurator_options.price may now be null, meaning the
-- client has not given us a price for that option yet. The builder still shows the option
-- and still previews it in 3D, but place_order() refuses to sell it, so an unpriced extra
-- can never be undercharged. products.base_price has worked this way since day one.

alter table public.configurator_options alter column price drop not null;

comment on column public.configurator_options.price is
  'Null means the price is still to be confirmed. The builder shows "Price on request" and checkout is blocked.';

-- Two new groups: the visor strip background, and chargeable personalisation.
alter table public.configurator_options drop constraint configurator_options_option_group_check;
alter table public.configurator_options
  add constraint configurator_options_option_group_check
  check (option_group in ('route', 'finish', 'base', 'trim', 'spoiler', 'material', 'visor_strip', 'personalisation'));

-- Metallic paint, alongside the chrome we already had. Price to be confirmed, so it
-- goes in unpriced rather than guessed.
insert into public.configurator_options (option_group, value, label, hint, swatch, price, sort_order) values
  ('material', 'metallic', 'Metallic', 'A metallic flake through the colour', '#b8bdc4', null, 2)
on conflict (option_group, value) do nothing;

-- Personalisation is free today and stays free until the client prices it.
insert into public.configurator_options (option_group, value, label, hint, swatch, price, sort_order) values
  ('personalisation', 'name', 'Name', 'Your name on the helmet', null, 0, 1),
  ('personalisation', 'number', 'Racing number', null, null, 0, 2),
  ('personalisation', 'initials', 'Initials', null, null, 0, 3),
  ('personalisation', 'flag', 'National flag', null, null, 0, 4),
  ('personalisation', 'text', 'Custom text', null, null, 0, 5)
on conflict (option_group, value) do nothing;

insert into public.configurator_options (option_group, value, label, hint, swatch, price, sort_order) values
  ('visor_strip', 'none', 'No visor strip', null, null, 0, 1),
  ('visor_strip', 'printed', 'Printed visor strip', 'Your text or logo across the top of the visor', null, null, 2)
on conflict (option_group, value) do nothing;

-- "Send my own helmet" is back (step 1 of the client's brief). It was switched off in
-- migration 000900 when the builder became new-helmet-only; place_order() now adds the
-- new-helmet price only when the customer actually wants one.
update public.configurator_options set is_active = true where option_group = 'route' and value = 'own';
update public.configurator_options
  set hint = 'Post it to us or drop it off. We''ll check it''s suitable before any work starts.'
  where option_group = 'route' and value = 'own';

-- ---------------------------------------------------------------------------
-- Helmet sizes become rows, so a size can carry a price and be taken off sale.
-- helmet_models.sizes stays as the fallback for anything not listed here.
-- ---------------------------------------------------------------------------
create table public.helmet_model_sizes (
  model_id text not null references public.helmet_models (id) on update cascade on delete cascade,
  size text not null,
  -- Surcharge on top of the helmet price. Null means "to be confirmed".
  price numeric(10, 2) default 0 check (price >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (model_id, size)
);

create trigger helmet_model_sizes_updated_at
  before update on public.helmet_model_sizes
  for each row execute function public.set_updated_at();

insert into public.helmet_model_sizes (model_id, size, price, sort_order)
select m.id, s.size, 0, s.ordinality
from public.helmet_models m
cross join lateral unnest(m.sizes) with ordinality as s(size, ordinality)
on conflict (model_id, size) do nothing;

-- ---------------------------------------------------------------------------
-- Aero kits (step 2). mesh_name is the node in the model's .glb that this kit shows;
-- null means the standard shell with nothing added.
-- ---------------------------------------------------------------------------
create table public.aero_kits (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  model_id text not null references public.helmet_models (id) on update cascade on delete cascade,
  name text not null,
  summary text,
  mesh_name text,
  price numeric(10, 2) check (price >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index aero_kits_model_idx on public.aero_kits (model_id, sort_order);

create trigger aero_kits_updated_at
  before update on public.aero_kits
  for each row execute function public.set_updated_at();

-- The Bell KC7 .glb already carries the standard shell and one spoiler mesh.
insert into public.aero_kits (id, model_id, name, summary, mesh_name, price, sort_order) values
  ('bell-kc7-standard', 'bell-kc7', 'Standard aero', 'The helmet as Bell supplies it.', null, 0, 1),
  ('bell-kc7-hp7-small', 'bell-kc7', 'HP7 F1 small spoiler', 'Low-profile rear spoiler.', 'Spoiler_HP7_F1_Small', null, 2),
  ('arai-sk6-standard', 'arai-sk6', 'Standard aero', 'The helmet as Arai supplies it.', null, 0, 1)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Visors (step 12). The Bell .glb has a separate Visor mesh with its own material,
-- which nothing has ever driven until now.
-- ---------------------------------------------------------------------------
create table public.visors (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  model_id text not null references public.helmet_models (id) on update cascade on delete cascade,
  name text not null,
  kind text not null check (kind in ('clear', 'smoked', 'coloured', 'iridium')),
  -- How the preview renders it.
  tint text not null default '#ffffff',
  opacity numeric(3, 2) not null default 0.35 check (opacity between 0 and 1),
  metalness numeric(3, 2) not null default 0 check (metalness between 0 and 1),
  price numeric(10, 2) check (price >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index visors_model_idx on public.visors (model_id, sort_order);

create trigger visors_updated_at
  before update on public.visors
  for each row execute function public.set_updated_at();

-- Clear is the visor that comes with the helmet, so it is included. The rest are
-- unpriced until the client confirms them.
insert into public.visors (id, model_id, name, kind, tint, opacity, metalness, price, sort_order)
select 'clear-' || m.id, m.id, 'Clear', 'clear', '#ffffff', 0.12, 0.0, 0, 1 from public.helmet_models m
union all
select 'smoked-' || m.id, m.id, 'Smoked', 'smoked', '#2b2f36', 0.72, 0.0, null, 2 from public.helmet_models m
union all
select 'iridium-silver-' || m.id, m.id, 'Iridium silver', 'iridium', '#c9d4e2', 0.62, 0.85, null, 3 from public.helmet_models m
union all
select 'iridium-blue-' || m.id, m.id, 'Iridium blue', 'iridium', '#3f6ad8', 0.62, 0.85, null, 4 from public.helmet_models m
on conflict (id) do nothing;

alter table public.helmet_model_sizes enable row level security;
alter table public.aero_kits enable row level security;
alter table public.visors enable row level security;

create policy "Anyone can read active sizes" on public.helmet_model_sizes
  for select to anon, authenticated using (is_active or (select public.is_admin()));
create policy "Admins manage sizes" on public.helmet_model_sizes
  for all to authenticated using ((select public.is_full_admin())) with check ((select public.is_full_admin()));

create policy "Anyone can read active aero kits" on public.aero_kits
  for select to anon, authenticated using (is_active or (select public.is_admin()));
create policy "Admins manage aero kits" on public.aero_kits
  for all to authenticated using ((select public.is_full_admin())) with check ((select public.is_full_admin()));

create policy "Anyone can read active visors" on public.visors
  for select to anon, authenticated using (is_active or (select public.is_admin()));
create policy "Admins manage visors" on public.visors
  for all to authenticated using ((select public.is_full_admin())) with check ((select public.is_full_admin()));
