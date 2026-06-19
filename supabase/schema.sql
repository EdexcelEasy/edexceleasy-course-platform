create table if not exists public.admin_subjects (
  id text primary key,
  name text not null,
  color text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_subject_topics (
  subject_id text not null references public.admin_subjects(id) on delete cascade,
  title text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (subject_id, title)
);

drop table if exists public.admin_subject_access;

create table if not exists public.admin_units (
  id text primary key,
  subject_id text not null references public.admin_subjects(id) on delete cascade,
  title text not null,
  revision_note_count integer not null default 0,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_unit_access (
  unit_id text not null references public.admin_units(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  primary key (unit_id, email)
);

create table if not exists public.admin_topics (
  id text primary key,
  unit_id text not null references public.admin_units(id) on delete cascade,
  title text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (unit_id, title)
);

create table if not exists public.admin_subtopics (
  id text primary key,
  topic_id text not null references public.admin_topics(id) on delete cascade,
  title text not null,
  drive_url text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_pdfs (
  id text primary key,
  title text not null,
  drive_url text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_pdf_access (
  pdf_id text not null references public.admin_pdfs(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  primary key (pdf_id, email)
);

create table if not exists public.app_user_roles (
  email text primary key,
  role text not null check (role in ('admin', 'student')),
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_admin_subjects_updated_at on public.admin_subjects;
create trigger set_admin_subjects_updated_at
before update on public.admin_subjects
for each row execute function public.set_updated_at();

drop trigger if exists set_admin_units_updated_at on public.admin_units;
create trigger set_admin_units_updated_at
before update on public.admin_units
for each row execute function public.set_updated_at();

drop trigger if exists set_admin_topics_updated_at on public.admin_topics;
create trigger set_admin_topics_updated_at
before update on public.admin_topics
for each row execute function public.set_updated_at();

drop trigger if exists set_admin_subtopics_updated_at on public.admin_subtopics;
create trigger set_admin_subtopics_updated_at
before update on public.admin_subtopics
for each row execute function public.set_updated_at();

drop trigger if exists set_admin_pdfs_updated_at on public.admin_pdfs;
create trigger set_admin_pdfs_updated_at
before update on public.admin_pdfs
for each row execute function public.set_updated_at();

drop trigger if exists set_app_user_roles_updated_at on public.app_user_roles;
create trigger set_app_user_roles_updated_at
before update on public.app_user_roles
for each row execute function public.set_updated_at();

alter table public.admin_subjects enable row level security;
alter table public.admin_subject_topics enable row level security;
alter table public.admin_units enable row level security;
alter table public.admin_unit_access enable row level security;
alter table public.admin_topics enable row level security;
alter table public.admin_subtopics enable row level security;
alter table public.admin_pdfs enable row level security;
alter table public.admin_pdf_access enable row level security;
alter table public.app_user_roles enable row level security;
