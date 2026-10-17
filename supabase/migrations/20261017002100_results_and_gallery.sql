-- Phase 10: race result details on news posts, the photo gallery, and Settings
-- switches to hide News or Gallery until the client has content.

-- Optional race result shown as a small results card:
-- {"event": "...", "circuit": "...", "class": "...", "driver": "...", "position": "P1"}
alter table public.news_posts
  add column result jsonb check (result is null or (jsonb_typeof(result) = 'object' and pg_column_size(result) < 2000));

alter table public.site_settings
  add column show_news boolean not null default true,
  add column show_gallery boolean not null default true;

-- ---------------------------------------------------------------------------
-- Gallery: albums of photos. Only client-supplied or client-approved photos.
-- ---------------------------------------------------------------------------
create table public.gallery_albums (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 100),
  title text not null check (char_length(title) between 2 and 120),
  event text not null default '' check (char_length(event) <= 120),
  album_date date,
  description text not null default '' check (char_length(description) <= 1000),
  cover_url text,
  is_published boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index gallery_albums_order_idx on public.gallery_albums (is_published, album_date desc nulls last, sort_order);

create trigger gallery_albums_updated_at before update on public.gallery_albums
  for each row execute function public.set_updated_at();

create table public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.gallery_albums (id) on delete cascade,
  image_url text not null,
  caption text not null default '' check (char_length(caption) <= 300),
  width integer check (width > 0),
  height integer check (height > 0),
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

create index gallery_photos_album_idx on public.gallery_photos (album_id, sort_order, created_at);

alter table public.gallery_albums enable row level security;
alter table public.gallery_photos enable row level security;

create policy "Anyone can read published albums" on public.gallery_albums
  for select to anon, authenticated using (is_published or (select public.is_admin()));
create policy "Admins manage albums" on public.gallery_albums
  for all to authenticated using ((select public.is_full_admin())) with check ((select public.is_full_admin()));

create policy "Anyone can read photos in published albums" on public.gallery_photos
  for select to anon, authenticated using (
    (select public.is_admin()) or exists (select 1 from public.gallery_albums a where a.id = album_id and a.is_published)
  );
create policy "Admins manage photos" on public.gallery_photos
  for all to authenticated using ((select public.is_full_admin())) with check ((select public.is_full_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gallery', 'gallery', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "Gallery: admins upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'gallery' and (select public.is_full_admin()));
create policy "Gallery: admins replace" on storage.objects
  for update to authenticated using (bucket_id = 'gallery' and (select public.is_full_admin()));
create policy "Gallery: admins remove" on storage.objects
  for delete to authenticated using (bucket_id = 'gallery' and (select public.is_full_admin()));
