-- Lucas Racing: the people behind the team, shown on Meet the Team, About and the homepage.
-- Admins manage them; everyone can read the active ones.

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  role text not null default '' check (char_length(role) <= 80),
  tagline text not null default '' check (char_length(tagline) <= 140),
  -- Paragraphs separated by a blank line.
  bio text not null default '' check (char_length(bio) <= 4000),
  photo_url text,
  photo_alt text not null default '',
  featured boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index team_members_order_idx on public.team_members (sort_order, name);

create trigger team_members_updated_at before update on public.team_members
  for each row execute function public.set_updated_at();

alter table public.team_members enable row level security;

create policy "Anyone can read active team members" on public.team_members
  for select to anon, authenticated using (is_active or (select public.is_admin()));
create policy "Admins manage team members" on public.team_members
  for all to authenticated using ((select public.is_full_admin())) with check ((select public.is_full_admin()));

-- Team photos: public bucket, admins upload.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('team-photos', 'team-photos', true, 3145728, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "Team photos: admins upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'team-photos' and (select public.is_full_admin()));
create policy "Team photos: admins replace" on storage.objects
  for update to authenticated using (bucket_id = 'team-photos' and (select public.is_full_admin()));
create policy "Team photos: admins remove" on storage.objects
  for delete to authenticated using (bucket_id = 'team-photos' and (select public.is_full_admin()));

-- The Lucas family, with the client's own words and photos.
insert into public.team_members (name, role, tagline, bio, photo_url, photo_alt, featured, sort_order) values
  (
    'Howard Lucas',
    'Founder',
    'The experience, knowledge and leadership behind Lucas Racing',
    E'Howard is the founder and driving force behind Lucas Racing. With decades of hands-on racing experience, he has built a reputation for understanding exactly what makes a competitive kart.\n\nFrom chassis preparation and technical development to race-day decisions and helping drivers find those crucial tenths of a second, his knowledge has been developed where it matters most: at the circuit.\n\nHis approach has always been straightforward: work hard, do things properly and give people the support they need to succeed.',
    '/images/team/howard.webp',
    'Howard Lucas shaking hands with a driver in the paddock',
    true,
    10
  ),
  (
    'Connor Lucas',
    'Racer and driver support',
    'Supporting drivers, especially younger racers, and leading by example',
    E'For Connor, karting has always been part of family life. Growing up around circuits, race teams and competitive motorsport, he has developed into an accomplished racer with a wealth of practical experience.\n\nWhat makes Connor so important to Lucas Racing is his willingness to help others, whether that''s supporting younger drivers, sharing advice, helping with kart preparation or encouraging someone after a difficult race.\n\nAs the next generation of Lucas Racing, Connor carries forward the family''s passion, knowledge and commitment to the people around them.',
    '/images/team/connor.webp',
    'Connor Lucas checking tyre pressures on an MS Kart',
    true,
    20
  ),
  (
    'Wendy Lucas',
    'Team manager',
    'Keeping everything running and looking after drivers, parents and the team',
    E'Howard''s wife and Connor''s mum, Wendy is the person who holds everything together behind the scenes.\n\nWhile the team is busy preparing karts, chasing lap times and competing on the circuit, Wendy is looking after the people who make it all possible, from organising the little details to making sure drivers and their parents are welcomed, looked after and, importantly, well fed.\n\nHer contribution might not appear on the timing sheets, but everyone involved knows just how important she is.',
    '/images/team/wendy.webp',
    'Wendy Lucas at the team hospitality table at a race meeting',
    true,
    30
  );
