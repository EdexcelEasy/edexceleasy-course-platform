create table if not exists public.app_user_roles (
  email text primary key,
  role text not null check (role in ('admin', 'student')),
  password_hash text not null default '',
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

drop trigger if exists set_app_user_roles_updated_at on public.app_user_roles;
create trigger set_app_user_roles_updated_at
before update on public.app_user_roles
for each row execute function public.set_updated_at();

alter table public.app_user_roles enable row level security;

insert into public.app_user_roles (email, role, password_hash, full_name)
values (
  'admin@edexceleasy.com',
  'admin',
  'scrypt:b36ac0d34ec20e1758cdf5543c31617d:d3cac8eca2689f3cce842fea5d12c864cea01cdc3aa80c076602a256290aaa77e284dede0b2e76b699093217813dd695579c701ae6eea709761dc7b00423d9cd',
  'Admin'
)
on conflict (email) do nothing;
