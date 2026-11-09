-- The helmet design competition ("Win a custom Arai SK-6").
--
-- Customers design a helmet in the builder and enter it. The workshop shortlists
-- entries in admin and picks a winner, who is announced on /competition. Admins
-- set the prize, dates and rules, and open or close entries, without a deploy.
--
-- Status of a competition:
--   upcoming  the page is up, entries aren't open yet (waiting on rules/dates)
--   open      entries accepted until closes_at
--   closed    entries closed, judging
--   judged    winner announced

create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{1,60}$'),
  title text not null check (char_length(title) between 3 and 120),
  prize text not null default '' check (char_length(prize) <= 500),
  description text not null default '' check (char_length(description) <= 2000),
  rules text[] not null default '{}',
  opens_at timestamptz,
  closes_at timestamptz,
  judging_date date,
  status text not null default 'upcoming' check (status in ('upcoming', 'open', 'closed', 'judged')),
  winner_entry_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger competitions_updated_at before update on public.competitions
  for each row execute function public.set_updated_at();

create sequence public.competition_entry_number start 1001;

create table public.competition_entries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('C-' || nextval('public.competition_entry_number')::text),
  competition_id uuid not null references public.competitions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  email text not null,
  design_name text not null check (char_length(design_name) between 1 and 60),
  product_slug text not null,
  config jsonb not null,
  summary jsonb not null default '[]',
  status text not null default 'entered' check (status in ('entered', 'shortlisted', 'winner', 'disqualified')),
  marketing_opt_in boolean not null default false,
  agreed_rules_at timestamptz not null,
  admin_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One entry per person; they can update it until entries close.
  unique (competition_id, user_id)
);

create index competition_entries_competition_idx on public.competition_entries (competition_id, created_at desc);

create trigger competition_entries_updated_at before update on public.competition_entries
  for each row execute function public.set_updated_at();

alter table public.competitions
  add constraint competitions_winner_fkey foreign key (winner_entry_id) references public.competition_entries (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Access

alter table public.competitions enable row level security;
alter table public.competition_entries enable row level security;

create policy "Anyone reads competitions" on public.competitions
  for select to anon, authenticated using (true);
create policy "Admins add competitions" on public.competitions
  for insert to authenticated with check ((select public.is_admin()));
create policy "Admins update competitions" on public.competitions
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Entrants read their own entries" on public.competition_entries
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Admins update entries" on public.competition_entries
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Entering: the only way to create or change an entry.
-- p_entry is { slug, designName, config, summary, agreedRules, marketingOptIn }.

create or replace function public.enter_competition(p_competition uuid, p_entry jsonb)
returns table (reference text, updated boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_profile public.profiles;
  v_competition public.competitions;
  v_config jsonb := p_entry -> 'config';
  v_path text;
  v_existing public.competition_entries;
begin
  if v_user is null then
    raise exception 'Please log in to enter.' using errcode = '28000';
  end if;
  select * into v_profile from public.profiles where id = v_user;
  if not found then
    raise exception 'Please log in to enter.' using errcode = '28000';
  end if;

  select * into v_competition from public.competitions where id = p_competition;
  if not found
    or v_competition.status <> 'open'
    or (v_competition.opens_at is not null and now() < v_competition.opens_at)
    or (v_competition.closes_at is not null and now() >= v_competition.closes_at) then
    raise exception 'This competition isn''t taking entries right now.' using errcode = '22023';
  end if;

  if coalesce((p_entry ->> 'agreedRules')::boolean, false) is not true then
    raise exception 'Please agree to the competition rules.' using errcode = '22023';
  end if;
  if jsonb_typeof(v_config) <> 'object'
    or coalesce(p_entry ->> 'slug', '') !~ '^[a-z0-9-]{1,80}$'
    or char_length(btrim(coalesce(p_entry ->> 'designName', ''))) not between 1 and 60
    or pg_column_size(p_entry) > 200000 then
    raise exception 'That entry couldn''t be saved. Please try again.' using errcode = '22023';
  end if;

  -- Images and prints must be the entrant's own uploads.
  for v_path in
    select logo ->> 'path' from jsonb_array_elements(case when jsonb_typeof(v_config -> 'logos') = 'array' then v_config -> 'logos' else '[]'::jsonb end) logo
    union all
    select region.value ->> 'print' from jsonb_each(case when jsonb_typeof(v_config -> 'regions') = 'object' then v_config -> 'regions' else '{}'::jsonb end) region
  loop
    continue when v_path is null;
    if v_path !~ ('^' || v_user::text || '/[0-9a-f-]{36}\.(png|jpg|webp)$')
      or not exists (select 1 from storage.objects o where o.bucket_id = 'design-logos' and o.name = v_path) then
      raise exception 'One of your images didn''t upload. Please add it again.' using errcode = '22023';
    end if;
  end loop;

  select * into v_existing from public.competition_entries e where e.competition_id = p_competition and e.user_id = v_user;
  if found and v_existing.status = 'disqualified' then
    raise exception 'Your entry can''t be changed. Please contact us.' using errcode = '22023';
  end if;

  return query
  insert into public.competition_entries as e (
    competition_id, user_id, name, email, design_name, product_slug, config, summary, marketing_opt_in, agreed_rules_at
  )
  values (
    p_competition,
    v_user,
    coalesce(nullif(btrim(v_profile.full_name), ''), split_part(v_profile.email, '@', 1)),
    lower(btrim(v_profile.email)),
    btrim(p_entry ->> 'designName'),
    p_entry ->> 'slug',
    v_config,
    case when jsonb_typeof(p_entry -> 'summary') = 'array' then p_entry -> 'summary' else '[]'::jsonb end,
    coalesce((p_entry ->> 'marketingOptIn')::boolean, false),
    now()
  )
  on conflict (competition_id, user_id) do update set
    design_name = excluded.design_name,
    product_slug = excluded.product_slug,
    config = excluded.config,
    summary = excluded.summary,
    marketing_opt_in = excluded.marketing_opt_in,
    agreed_rules_at = excluded.agreed_rules_at,
    name = excluded.name,
    email = excluded.email
  returning e.reference, (v_existing.id is not null);
end;
$$;

revoke all on function public.enter_competition(uuid, jsonb) from public;
grant execute on function public.enter_competition(uuid, jsonb) to authenticated;

-- Picks the winner in one step: the entry becomes the winner, any earlier winner
-- goes back to the shortlist, and the competition is marked judged.
create or replace function public.choose_competition_winner(p_entry uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_entry public.competition_entries;
begin
  if not (select public.is_admin()) then
    raise exception 'You don''t have permission to do that.' using errcode = '42501';
  end if;
  select * into v_entry from public.competition_entries where id = p_entry;
  if not found or v_entry.status = 'disqualified' then
    raise exception 'That entry can''t win.' using errcode = '22023';
  end if;
  update public.competition_entries set status = 'shortlisted'
  where competition_id = v_entry.competition_id and status = 'winner' and id <> p_entry;
  update public.competition_entries set status = 'winner' where id = p_entry;
  update public.competitions set winner_entry_id = p_entry, status = 'judged' where id = v_entry.competition_id;
end;
$$;

revoke all on function public.choose_competition_winner(uuid) from public;
grant execute on function public.choose_competition_winner(uuid) to authenticated;

-- What the public page shows about the winner: first name and the design's name only.
create or replace function public.competition_winner(p_competition uuid)
returns table (first_name text, design_name text, product_slug text)
language sql
stable
security definer
set search_path = ''
as $$
  select split_part(e.name, ' ', 1), e.design_name, e.product_slug
  from public.competitions c
  join public.competition_entries e on e.id = c.winner_entry_id
  where c.id = p_competition and c.status = 'judged';
$$;

revoke all on function public.competition_winner(uuid) from public;
grant execute on function public.competition_winner(uuid) to anon, authenticated;

-- The competition the client has announced. Entries open once the rules and dates are in.
insert into public.competitions (slug, title, prize, description, status)
values (
  'arai-sk6',
  'Win a custom Arai SK-6',
  'A brand new white Arai SK-6, customised by HydroKarts to the winning design.',
  'Design the best helmet using our website and we''ll make it for you.',
  'upcoming'
);
