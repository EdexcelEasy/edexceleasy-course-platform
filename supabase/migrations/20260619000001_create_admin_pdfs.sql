create table if not exists public.admin_pdfs (
  id text primary key,
  title text not null,
  drive_url text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_admin_pdfs_updated_at on public.admin_pdfs;
create trigger set_admin_pdfs_updated_at
before update on public.admin_pdfs
for each row execute function public.set_updated_at();

alter table public.admin_pdfs enable row level security;
