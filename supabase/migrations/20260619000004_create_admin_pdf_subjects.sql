create table if not exists public.admin_pdf_subjects (
  id text primary key,
  name text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_admin_pdf_subjects_updated_at on public.admin_pdf_subjects;
create trigger set_admin_pdf_subjects_updated_at
before update on public.admin_pdf_subjects
for each row execute function public.set_updated_at();

alter table public.admin_pdf_subjects enable row level security;

alter table public.admin_pdfs
add column if not exists pdf_subject_id text references public.admin_pdf_subjects(id) on delete set null;
