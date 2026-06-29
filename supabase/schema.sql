-- ============================================================
-- Deep Waters RTC — Coaching Ledger : Supabase schema
-- Run this once in Supabase → SQL Editor → New query → Run.
-- Safe to re-run: it drops & recreates the tables and policies.
-- ============================================================

-- ---------- clean slate (optional, comment out to preserve data) ----------
drop table if exists public.session_athletes cascade;
drop table if exists public.sessions cascade;
drop table if exists public.athletes cascade;

-- ---------- athletes ----------
create table public.athletes (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null,
  level       text default 'Youth',        -- Youth | HS | College | Adult
  rate        numeric default 0,           -- $/hr
  phone       text default '',
  email       text default '',
  guardian    text default '',
  notes       text default '',
  active      boolean default true,
  color       int default 0,               -- avatar palette index
  created_at  timestamptz default now()
);

-- ---------- sessions ----------
create table public.sessions (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date        timestamptz not null default now(),
  mins        int default 60,
  kind        text default 'private',      -- private | group
  focus       text default '',
  amount      numeric default 0,           -- total charged for the session
  paid        boolean default false,
  paid_date   timestamptz,
  method      text default '',             -- Venmo | Zelle | Cash | Card | Check
  notes       text default '',
  created_at  timestamptz default now()
);

-- ---------- join: which athletes attended which session ----------
create table public.session_athletes (
  session_id  uuid not null references public.sessions(id) on delete cascade,
  athlete_id  uuid not null references public.athletes(id) on delete cascade,
  owner       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  primary key (session_id, athlete_id)
);

-- ---------- indexes ----------
create index athletes_owner_idx        on public.athletes(owner);
create index sessions_owner_date_idx   on public.sessions(owner, date desc);
create index sa_session_idx            on public.session_athletes(session_id);
create index sa_athlete_idx            on public.session_athletes(athlete_id);

-- ============================================================
-- Row Level Security — each user only ever sees their own rows
-- ============================================================
alter table public.athletes         enable row level security;
alter table public.sessions         enable row level security;
alter table public.session_athletes enable row level security;

create policy "athletes are private to owner"
  on public.athletes for all
  using (owner = auth.uid())
  with check (owner = auth.uid());

create policy "sessions are private to owner"
  on public.sessions for all
  using (owner = auth.uid())
  with check (owner = auth.uid());

create policy "links are private to owner"
  on public.session_athletes for all
  using (owner = auth.uid())
  with check (owner = auth.uid());
