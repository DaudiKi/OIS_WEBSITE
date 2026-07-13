-- OIS AMS database schema for Supabase.
-- Run this in the Supabase SQL editor (or via supabase db push) after
-- creating a project, then configure public/ams-config.js on the website.

create extension if not exists pgcrypto;

-- Profiles mirror auth.users and carry the AMS role.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  email text not null default '',
  phone text not null default '',
  role text not null default 'parent' check (role in ('admin', 'teacher', 'parent', 'student')),
  status text not null default 'active' check (status in ('active', 'pending', 'disabled')),
  "studentId" text,
  "childIds" text[],
  "createdAt" timestamptz not null default now()
);

-- Auto-create a profile on signup. Teacher/admin signups start as pending.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, phone, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'parent'),
    case
      when coalesce(new.raw_user_meta_data ->> 'role', 'parent') in ('teacher', 'admin') then 'pending'
      else 'active'
    end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table if not exists public.teachers (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  email text not null default '',
  phone text not null default '',
  subject text not null default '',
  role text not null default '',
  "createdAt" timestamptz not null default now()
);

create table if not exists public.classes (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  level text not null default '',
  "teacherId" text references public.teachers (id) on delete set null,
  room text not null default '',
  "createdAt" timestamptz not null default now()
);

create table if not exists public.students (
  id text primary key default gen_random_uuid()::text,
  "firstName" text not null,
  "lastName" text not null,
  gender text not null default '',
  dob date,
  "classId" text references public.classes (id) on delete set null,
  "parentName" text not null default '',
  "parentPhone" text not null default '',
  "parentEmail" text not null default '',
  status text not null default 'active',
  "admittedAt" timestamptz not null default now(),
  "createdAt" timestamptz not null default now()
);

create table if not exists public.grades (
  id text primary key default gen_random_uuid()::text,
  "studentId" text not null references public.students (id) on delete cascade,
  subject text not null,
  term text not null default '',
  score numeric not null default 0,
  "maxScore" numeric not null default 100,
  comment text not null default '',
  "recordedAt" timestamptz not null default now(),
  "createdAt" timestamptz not null default now()
);

create table if not exists public.attendance (
  id text primary key default gen_random_uuid()::text,
  "studentId" text not null references public.students (id) on delete cascade,
  "classId" text not null references public.classes (id) on delete cascade,
  date date not null,
  status text not null default 'present' check (status in ('present', 'absent', 'late', 'excused')),
  "createdAt" timestamptz not null default now()
);

create table if not exists public.announcements (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  body text not null default '',
  audience text not null default 'all',
  author text not null default '',
  "createdAt" timestamptz not null default now()
);

create table if not exists public.events (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  date date not null,
  "endDate" date,
  "startTime" text not null default '',
  "endTime" text not null default '',
  location text not null default '',
  description text not null default '',
  category text not null default 'school',
  published boolean not null default true,
  "createdAt" timestamptz not null default now()
);

create table if not exists public.applications (
  id text primary key default gen_random_uuid()::text,
  "studentName" text not null default '',
  "firstName" text not null default '',
  "lastName" text not null default '',
  dob text not null default '',
  gender text not null default '',
  "parentName" text not null default '',
  relationship text not null default '',
  email text not null default '',
  phone text not null default '',
  address text not null default '',
  "previousSchool" text not null default '',
  "gradeApplying" text not null default '',
  "specialNeeds" text not null default '',
  "referralSource" text not null default '',
  comments text not null default '',
  status text not null default 'new' check (status in ('new', 'reviewing', 'accepted', 'rejected')),
  "submittedAt" timestamptz not null default now(),
  "createdAt" timestamptz not null default now()
);

create table if not exists public.gallery_items (
  id text primary key default gen_random_uuid()::text,
  category text not null default 'events',
  image text not null,
  webp text,
  alt text not null default '',
  "lightboxTitle" text not null default '',
  title text not null default '',
  description text not null default '',
  published boolean not null default true,
  "createdAt" timestamptz not null default now()
);

-- Row level security ---------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.teachers enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.grades enable row level security;
alter table public.attendance enable row level security;
alter table public.announcements enable row level security;
alter table public.events enable row level security;
alter table public.applications enable row level security;
alter table public.gallery_items enable row level security;

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'teacher') and status = 'active'
  );
$$;

-- Profiles: users see their own profile; staff see all; admins manage all.
create policy "profiles_select_own" on public.profiles for select using (id = auth.uid() or public.is_staff());
create policy "profiles_update_admin" on public.profiles for update using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.status = 'active')
);

-- Staff manage school records; signed-in users can read them.
do $$
declare t text;
begin
  foreach t in array array['teachers', 'classes', 'students', 'grades', 'attendance', 'announcements'] loop
    execute format('create policy "%s_read" on public.%I for select using (auth.role() = ''authenticated'')', t, t);
    execute format('create policy "%s_write" on public.%I for all using (public.is_staff()) with check (public.is_staff())', t, t);
  end loop;
end $$;

-- Events and gallery are publicly readable (they feed the public website).
create policy "events_public_read" on public.events for select using (true);
create policy "events_staff_write" on public.events for all using (public.is_staff()) with check (public.is_staff());
create policy "gallery_public_read" on public.gallery_items for select using (true);
create policy "gallery_staff_write" on public.gallery_items for all using (public.is_staff()) with check (public.is_staff());

-- Applications: anyone (including anonymous website visitors) can submit;
-- only staff can read and manage them.
create policy "applications_public_insert" on public.applications for insert with check (true);
create policy "applications_staff_read" on public.applications for select using (public.is_staff());
create policy "applications_staff_update" on public.applications for update using (public.is_staff());
create policy "applications_staff_delete" on public.applications for delete using (public.is_staff());
