create table if not exists public.admin_deleted_seed_subjects (
  subject_id text primary key,
  deleted_at timestamptz not null default now()
);

alter table public.admin_deleted_seed_subjects enable row level security;
