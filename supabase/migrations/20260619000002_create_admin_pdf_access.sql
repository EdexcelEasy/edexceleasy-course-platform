create table if not exists public.admin_pdf_access (
  pdf_id text not null references public.admin_pdfs(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  primary key (pdf_id, email)
);

alter table public.admin_pdf_access enable row level security;
