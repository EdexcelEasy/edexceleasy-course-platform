alter table public.app_user_roles
add column if not exists password_hash text not null default '';

insert into public.app_user_roles (email, role, password_hash, full_name)
values (
  'admin@edexceleasy.com',
  'admin',
  'scrypt:b36ac0d34ec20e1758cdf5543c31617d:d3cac8eca2689f3cce842fea5d12c864cea01cdc3aa80c076602a256290aaa77e284dede0b2e76b699093217813dd695579c701ae6eea709761dc7b00423d9cd',
  'Admin'
)
on conflict (email) do update
set
  role = excluded.role,
  password_hash = case
    when public.app_user_roles.password_hash = '' then excluded.password_hash
    else public.app_user_roles.password_hash
  end,
  full_name = coalesce(public.app_user_roles.full_name, excluded.full_name);
