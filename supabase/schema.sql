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

-- ===========================================================================
-- ICCE report cards
-- ===========================================================================

-- Columns the report card needs on existing tables. Safe to re-run.
alter table public.students add column if not exists photo text default '';
alter table public.students add column if not exists "icceLevel" text default '';
alter table public.classes  add column if not exists "supervisorIds" text[] default array[]::text[];

create table if not exists public.terms (
  id text primary key default ('trm-' || substr(md5(random()::text), 1, 10)),
  name text not null,
  number int,
  year int not null,
  "startDate" date,
  "endDate" date,
  status text not null default 'planned',   -- planned | open | closed
  "createdAt" timestamptz not null default now()
);

create table if not exists public.settings (
  id text primary key,
  value jsonb not null default '{}'::jsonb,
  "updatedAt" timestamptz not null default now()
);

create table if not exists public.reports (
  id text primary key default ('rpt-' || substr(md5(random()::text), 1, 10)),
  "studentId" text not null references public.students(id) on delete cascade,
  "termId" text not null references public.terms(id) on delete cascade,
  status text not null default 'draft',     -- draft|submitted|returned|verified|published
  subjects jsonb not null default '[]'::jsonb,   -- [{ name, scores: [number] }]
  traits jsonb not null default '{}'::jsonb,
  "bibleMemory" jsonb not null default '[]'::jsonb,
  comments text default '',
  attendance jsonb default '{}'::jsonb,
  "returnNote" text,
  history jsonb not null default '[]'::jsonb,
  "submittedAt" timestamptz,
  "verifiedAt" timestamptz,
  "publishedAt" timestamptz,
  "returnedAt" timestamptz,
  "submittedBy" text,
  "verifiedBy" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz,
  unique ("studentId", "termId")
);

alter table public.terms enable row level security;
alter table public.settings enable row level security;
alter table public.reports enable row level security;

-- Terms and settings: everyone signed in can read, staff can change.
create policy "terms_read" on public.terms for select using (auth.role() = 'authenticated');
create policy "terms_write" on public.terms for all using (public.is_staff()) with check (public.is_staff());
create policy "settings_read" on public.settings for select using (auth.role() = 'authenticated');
create policy "settings_write" on public.settings for all using (public.is_staff()) with check (public.is_staff());

-- Reports: staff see everything; a family sees only PUBLISHED reports
-- belonging to their own children. This is enforced in the database, so a
-- modified client cannot reach another family's records.
create policy "reports_staff_read" on public.reports for select using (public.is_staff());

create policy "reports_family_read" on public.reports for select using (
  status = 'published'
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and (
        p."studentId" = public.reports."studentId"
        or public.reports."studentId" = any (coalesce(p."childIds", array[]::text[]))
      )
  )
);

create policy "reports_staff_write" on public.reports for all
  using (public.is_staff()) with check (public.is_staff());

-- The report lifecycle runs server-side so the allowed transitions and the
-- audit trail cannot be bypassed from the browser.
create or replace function public.transition_report(
  report_id text,
  action text,
  actor text default null,
  note text default null
) returns public.reports
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.reports;
  next_status text;
  allowed text[];
begin
  if not public.is_staff() then
    raise exception 'Only school staff may change a report''s status.';
  end if;

  select * into r from public.reports where id = report_id for update;
  if not found then
    raise exception 'Report not found.';
  end if;

  case action
    when 'submit'    then next_status := 'submitted'; allowed := array['draft', 'returned'];
    when 'return'    then next_status := 'returned';  allowed := array['submitted', 'verified'];
    when 'verify'    then next_status := 'verified';  allowed := array['submitted'];
    when 'publish'   then next_status := 'published'; allowed := array['verified'];
    when 'unpublish' then next_status := 'verified';  allowed := array['published'];
    else raise exception 'Unknown report action: %', action;
  end case;

  if not (r.status = any (allowed)) then
    raise exception 'A report that is "%" cannot be %ed.', r.status, action;
  end if;

  -- Verifying and publishing are the administrator's alone.
  if action in ('verify', 'publish', 'unpublish') and not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and p.status = 'active'
  ) then
    raise exception 'Only an administrator may % a report.', action;
  end if;

  update public.reports set
    status = next_status,
    "submittedAt"  = case when action = 'submit'  then now() else "submittedAt"  end,
    "returnedAt"   = case when action = 'return'  then now() else "returnedAt"   end,
    "verifiedAt"   = case when action = 'verify'  then now() else "verifiedAt"   end,
    "publishedAt"  = case when action = 'publish' then now() else "publishedAt"  end,
    "returnNote"   = case when action = 'return'  then note  else "returnNote"   end,
    "submittedBy"  = case when action = 'submit'  then auth.uid()::text else "submittedBy" end,
    "verifiedBy"   = case when action = 'verify'  then auth.uid()::text else "verifiedBy"  end,
    history = history || jsonb_build_object(
      'at', now(), 'by', coalesce(actor, 'Unknown'), 'action', action, 'note', coalesce(note, '')
    ),
    "updatedAt" = now()
  where id = report_id
  returning * into r;

  return r;
end;
$$;

-- Function privileges ---------------------------------------------------------
-- Postgres grants EXECUTE on new functions to the PUBLIC pseudo-role, which
-- exposes them at /rest/v1/rpc/<name>. Revoking from anon/authenticated alone
-- does nothing while that inherited PUBLIC grant remains, so revoke from
-- PUBLIC and grant back only what each role genuinely needs.

-- A trigger function has no business being callable over REST. EXECUTE is
-- checked at CREATE TRIGGER time rather than on each fire, so signup still works.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- The report lifecycle belongs to signed-in staff. transition_report also
-- checks is_staff() internally; this additionally removes it from the
-- anonymous API surface instead of relying on that check alone.
revoke execute on function public.transition_report(text, text, text, text) from public, anon, authenticated;
grant execute on function public.transition_report(text, text, text, text) to authenticated;

-- public.is_staff() deliberately keeps its PUBLIC grant. The "for all" staff
-- write policies on events and gallery_items evaluate their USING clause even
-- for anonymous visitors, so revoking it would break the public website feeds.
-- It discloses nothing: it reads only the caller's own profile row and returns
-- a boolean.

-- Seed the default ICCE grading scale (Handbook Africa 2021 Rev 0W, p.39).
insert into public.settings (id, value) values ('school', jsonb_build_object(
  'school', jsonb_build_object(
    'name', 'OrchardsWood International School',
    'address', 'Wavamunno Rd., Kampala, Uganda',
    'email', 'orchardswoodis@gmail.com',
    'phone', '+256 780394344',
    'website', 'www.ois.ug',
    'motto', 'Equipping this generation for Life'
  ),
  'gradeScale', jsonb_build_array(
    jsonb_build_object('grade', 'A*', 'min', 98, 'max', 100),
    jsonb_build_object('grade', 'A',  'min', 96, 'max', 97.99),
    jsonb_build_object('grade', 'B',  'min', 92, 'max', 95.99),
    jsonb_build_object('grade', 'C',  'min', 88, 'max', 91.99),
    jsonb_build_object('grade', 'D',  'min', 84, 'max', 87.99),
    jsonb_build_object('grade', 'E',  'min', 80, 'max', 83.99)
  ),
  'subjects', jsonb_build_array(
    'Maths', 'English', 'Science', 'Social Studies', 'Word Building', 'Literature', 'Bible Reading'
  )
)) on conflict (id) do nothing;
