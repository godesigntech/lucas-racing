-- News and blog: posts in categories, written in Markdown by admins.
-- Everyone reads published posts whose publish time has passed (so a post can be
-- scheduled); admins read and manage everything.

create table public.news_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 60),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  description text not null default '' check (char_length(description) <= 300),
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger news_categories_updated_at before update on public.news_categories
  for each row execute function public.set_updated_at();

create table public.news_posts (
  id uuid primary key default gen_random_uuid(),
  -- "category" is reserved for /news/category/<slug>.
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 100 and slug <> 'category'),
  title text not null check (char_length(title) between 3 and 160),
  excerpt text not null default '' check (char_length(excerpt) <= 320),
  -- Markdown.
  body text not null default '' check (char_length(body) <= 60000),
  cover_url text,
  cover_alt text not null default '' check (char_length(cover_alt) <= 200),
  category_id uuid references public.news_categories (id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  featured boolean not null default false,
  author_name text not null default 'Lucas Racing' check (char_length(author_name) <= 80),
  seo_title text not null default '' check (char_length(seo_title) <= 70),
  seo_description text not null default '' check (char_length(seo_description) <= 170),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status = 'draft' or published_at is not null)
);

create index news_posts_published_idx on public.news_posts (status, published_at desc);
create index news_posts_category_idx on public.news_posts (category_id, published_at desc);

create trigger news_posts_updated_at before update on public.news_posts
  for each row execute function public.set_updated_at();

alter table public.news_categories enable row level security;
alter table public.news_posts enable row level security;

create policy "Anyone can read news categories" on public.news_categories
  for select to anon, authenticated using (true);
create policy "Admins manage news categories" on public.news_categories
  for all to authenticated using ((select public.is_full_admin())) with check ((select public.is_full_admin()));

create policy "Anyone can read published news" on public.news_posts
  for select to anon, authenticated using (
    (status = 'published' and published_at <= now()) or (select public.is_admin())
  );
create policy "Admins manage news" on public.news_posts
  for all to authenticated using ((select public.is_full_admin())) with check ((select public.is_full_admin()));

-- Cover and in-article photos: public bucket, admins upload.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('news-images', 'news-images', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "News images: admins upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'news-images' and (select public.is_full_admin()));
create policy "News images: admins replace" on storage.objects
  for update to authenticated using (bucket_id = 'news-images' and (select public.is_full_admin()));
create policy "News images: admins remove" on storage.objects
  for delete to authenticated using (bucket_id = 'news-images' and (select public.is_full_admin()));

-- Starting categories; admins can rename, add or remove them.
insert into public.news_categories (name, slug, description, sort_order) values
  ('Race reports', 'race-reports', 'How the weekend went for Lucas Racing drivers, round by round.', 10),
  ('Results', 'results', 'Results and championship standings for our drivers.', 20),
  ('Team news', 'team-news', 'New drivers, test days and life at Lucas Racing.', 30),
  ('MS Kart', 'ms-kart', 'New chassis, parts and updates from MS Kart.', 40),
  ('Events', 'events', 'Shows, open days and where to find the team.', 50)
on conflict (slug) do nothing;
