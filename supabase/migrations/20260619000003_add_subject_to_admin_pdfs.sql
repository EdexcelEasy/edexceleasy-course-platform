alter table public.admin_pdfs
add column if not exists subject_id text references public.admin_subjects(id) on delete set null;
