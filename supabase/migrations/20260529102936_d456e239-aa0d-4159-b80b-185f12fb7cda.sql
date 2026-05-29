
-- Enums
create type public.app_role as enum ('member', 'moderator', 'nufc_admin');
create type public.content_status as enum ('pending', 'approved', 'rejected', 'escalated');
create type public.event_type as enum ('watch_party', 'pub_meet', 'away_day', 'other');
create type public.rsvp_status as enum ('going', 'maybe', 'declined');

-- Chapters
create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  city text not null,
  country text not null,
  created_at timestamptz not null default now()
);

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  chapter_id uuid references public.chapters(id) on delete set null,
  display_name text not null,
  avatar_url text,
  joined_at timestamptz not null default now()
);

-- Roles (separate table — never on profile)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  chapter_id uuid references public.chapters(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, role, chapter_id)
);

-- has_role security definer
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create or replace function public.is_chapter_mod(_user_id uuid, _chapter_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id
      and chapter_id = _chapter_id
      and role in ('moderator','nufc_admin')
  ) or exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = 'nufc_admin'
  )
$$;

-- Events
create table public.events (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  title text not null,
  description text,
  venue text not null,
  starts_at timestamptz not null,
  type event_type not null default 'watch_party',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.event_rsvps (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status rsvp_status not null default 'going',
  checked_in_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- Announcements
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  title text not null,
  body text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Content
create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  media_url text,
  caption text,
  status content_status not null default 'pending',
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Points ledger
create table public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  delta integer not null,
  reason text not null,
  ref_id uuid,
  created_at timestamptz not null default now()
);

-- Invites (unused in demo)
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  code text not null unique,
  expires_at timestamptz,
  uses_remaining integer not null default 50,
  created_at timestamptz not null default now()
);

-- GRANTS
grant select on public.chapters to anon, authenticated;
grant all on public.chapters to service_role;

grant select, insert, update on public.profiles to authenticated;
grant select on public.profiles to anon;
grant all on public.profiles to service_role;

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

grant select, insert, update, delete on public.events to authenticated;
grant select on public.events to anon;
grant all on public.events to service_role;

grant select, insert, update, delete on public.event_rsvps to authenticated;
grant all on public.event_rsvps to service_role;

grant select, insert, update, delete on public.announcements to authenticated;
grant select on public.announcements to anon;
grant all on public.announcements to service_role;

grant select, insert, update on public.content_items to authenticated;
grant select on public.content_items to anon;
grant all on public.content_items to service_role;

grant select, insert on public.points_ledger to authenticated;
grant select on public.points_ledger to anon;
grant all on public.points_ledger to service_role;

grant select, insert, update on public.invites to authenticated;
grant all on public.invites to service_role;

-- RLS
alter table public.chapters enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.announcements enable row level security;
alter table public.content_items enable row level security;
alter table public.points_ledger enable row level security;
alter table public.invites enable row level security;

-- Demo-friendly policies: readable by everyone (including anon for demo mode)
create policy "chapters readable" on public.chapters for select using (true);
create policy "chapters admin write" on public.chapters for all to authenticated
  using (public.has_role(auth.uid(), 'nufc_admin'))
  with check (public.has_role(auth.uid(), 'nufc_admin'));

create policy "profiles readable" on public.profiles for select using (true);
create policy "profiles self update" on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles self insert" on public.profiles for insert to authenticated
  with check (auth.uid() = id);

create policy "roles readable" on public.user_roles for select to authenticated using (true);

create policy "events readable" on public.events for select using (true);
create policy "events mod write" on public.events for insert to authenticated
  with check (public.is_chapter_mod(auth.uid(), chapter_id));
create policy "events mod update" on public.events for update to authenticated
  using (public.is_chapter_mod(auth.uid(), chapter_id));
create policy "events mod delete" on public.events for delete to authenticated
  using (public.is_chapter_mod(auth.uid(), chapter_id));

create policy "rsvps readable" on public.event_rsvps for select using (true);
create policy "rsvps self write" on public.event_rsvps for insert to authenticated
  with check (auth.uid() = user_id);
create policy "rsvps self update" on public.event_rsvps for update to authenticated
  using (auth.uid() = user_id);
create policy "rsvps self delete" on public.event_rsvps for delete to authenticated
  using (auth.uid() = user_id);

create policy "ann readable" on public.announcements for select using (true);
create policy "ann mod write" on public.announcements for insert to authenticated
  with check (public.is_chapter_mod(auth.uid(), chapter_id));
create policy "ann mod update" on public.announcements for update to authenticated
  using (public.is_chapter_mod(auth.uid(), chapter_id));
create policy "ann mod delete" on public.announcements for delete to authenticated
  using (public.is_chapter_mod(auth.uid(), chapter_id));

create policy "content readable" on public.content_items for select using (true);
create policy "content self submit" on public.content_items for insert to authenticated
  with check (auth.uid() = author_id);
create policy "content mod review" on public.content_items for update to authenticated
  using (public.is_chapter_mod(auth.uid(), chapter_id));

create policy "points readable" on public.points_ledger for select using (true);
create policy "points mod award" on public.points_ledger for insert to authenticated
  with check (public.is_chapter_mod(auth.uid(), chapter_id));

create policy "invites readable" on public.invites for select to authenticated using (true);
create policy "invites mod write" on public.invites for all to authenticated
  using (public.is_chapter_mod(auth.uid(), chapter_id))
  with check (public.is_chapter_mod(auth.uid(), chapter_id));

-- Indexes
create index on public.profiles (chapter_id);
create index on public.events (chapter_id, starts_at);
create index on public.announcements (chapter_id, created_at desc);
create index on public.content_items (chapter_id, status);
create index on public.points_ledger (chapter_id, user_id);
create index on public.user_roles (user_id);
