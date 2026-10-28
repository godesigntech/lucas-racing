-- Phase 8: the 16-step helmet journey, part 1 of 4 — design templates as data.
--
-- Until now a design's artwork lived in code: src/lib/helmet-3d/templates.ts listed six
-- Bell KC7 slugs, and src/components/helmet/helmet-art.tsx held the SVG paths. Adding a
-- design meant a deploy. These two tables move that into the database so the workshop can
-- add templates, and so each template can declare its own editable regions instead of the
-- three hard-coded ones (shell / graphic / pinstripe).
--
-- A design (public.products) is the marketing record and the price. A design_template is
-- the artwork for one design on one helmet model, because masks are tied to that model's
-- UVs. Regions belong to the artwork, not to the design.

create table public.design_templates (
  id uuid primary key default gen_random_uuid(),
  product_slug text not null references public.products (slug) on update cascade on delete cascade,
  model_id text not null references public.helmet_models (id) on update cascade on delete cascade,
  -- Vector source. Null while a template still ships as baked masks.
  svg_url text,
  -- Baked greyscale masks, the pipeline we have artwork for today.
  graphic_mask_url text,
  accent_mask_url text,
  thumbnail_url text,
  -- 'ready'       — artwork exists and the 3D preview can show it.
  -- 'pending'     — waiting on the 3D artist; the builder falls back to the illustration.
  -- 'placeholder' — stand-in artwork, clearly labelled to customers.
  artwork_status text not null default 'pending'
    check (artwork_status in ('ready', 'pending', 'placeholder')),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_slug, model_id)
);

create index design_templates_model_idx on public.design_templates (model_id, sort_order);

create trigger design_templates_updated_at
  before update on public.design_templates
  for each row execute function public.set_updated_at();

-- The separately editable areas of one template. 'fill' is a shape the customer colours,
-- 'pinstripe' is a racing line (kept distinct so step 7 can list only the lines), 'trim'
-- is a painted edge. Each region says which treatments it accepts, so the builder can grey
-- out what the artwork cannot carry.
create table public.template_regions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.design_templates (id) on delete cascade,
  key text not null check (key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  label text not null,
  kind text not null default 'fill' check (kind in ('fill', 'pinstripe', 'trim')),
  -- Mask for this region, or the id of the SVG element when the template has an svg_url.
  mask_url text,
  svg_element_id text,
  default_colour text not null default '#ffffff',
  allows_film boolean not null default true,
  allows_chrome boolean not null default false,
  allows_metallic boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_id, key)
);

create index template_regions_template_idx on public.template_regions (template_id, sort_order);

create trigger template_regions_updated_at
  before update on public.template_regions
  for each row execute function public.set_updated_at();

alter table public.design_templates enable row level security;
alter table public.template_regions enable row level security;

create policy "Anyone can read active templates" on public.design_templates
  for select to anon, authenticated
  using (is_active or (select public.is_admin()));

create policy "Admins manage templates" on public.design_templates
  for all to authenticated
  using ((select public.is_full_admin()))
  with check ((select public.is_full_admin()));

create policy "Anyone can read regions of active templates" on public.template_regions
  for select to anon, authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1 from public.design_templates t
      where t.id = template_id and t.is_active
    )
  );

create policy "Admins manage regions" on public.template_regions
  for all to authenticated
  using ((select public.is_full_admin()))
  with check ((select public.is_full_admin()));

-- ---------------------------------------------------------------------------
-- Seed: the artwork already on disk, so nothing regresses.
-- /public/models/templates/bell-kc7/<slug>/{graphic-mask,accent-mask,thumbnail}.png
-- ---------------------------------------------------------------------------
insert into public.design_templates
  (product_slug, model_id, graphic_mask_url, accent_mask_url, thumbnail_url, artwork_status, sort_order)
select
  slug,
  'bell-kc7',
  '/models/templates/bell-kc7/' || slug || '/graphic-mask.png',
  '/models/templates/bell-kc7/' || slug || '/accent-mask.png',
  '/models/templates/bell-kc7/' || slug || '/thumbnail.png',
  'ready',
  ordinality
from unnest(array['apex', 'twin-stripe', 'split-tone', 'shard', 'forged-flow', 'chrome-strike'])
  with ordinality as t(slug, ordinality)
where exists (select 1 from public.products p where p.slug = t.slug)
on conflict (product_slug, model_id) do nothing;

-- Designs with no 3D artwork yet still get a row, so the admin panel lists every
-- design against every helmet and shows what the 3D artist still owes us.
insert into public.design_templates (product_slug, model_id, artwork_status, sort_order)
select p.slug, m.id, 'pending', p.sort_order
from public.products p
cross join public.helmet_models m
where m.id = any (p.model_ids)
on conflict (product_slug, model_id) do nothing;

-- The three regions the current artwork carries. 'blank-canvas' has no graphic shape.
insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, allows_chrome, sort_order)
select t.id, 'base', 'Shell', 'fill', null, '#101114', true, 1
from public.design_templates t
on conflict (template_id, key) do nothing;

insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, sort_order)
select t.id, 'graphic', 'Graphic', 'fill', t.graphic_mask_url, '#d81f2a', 2
from public.design_templates t
where t.product_slug <> 'blank-canvas'
on conflict (template_id, key) do nothing;

insert into public.template_regions (template_id, key, label, kind, mask_url, default_colour, sort_order)
select t.id, 'accent', 'Pinstripe', 'pinstripe', t.accent_mask_url, '#f2f2f2', 3
from public.design_templates t
where t.product_slug <> 'blank-canvas'
on conflict (template_id, key) do nothing;
