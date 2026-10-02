-- ELITE QR — Supabase foundation
create extension if not exists pgcrypto;

create type public.app_role as enum ('admin','planejador','tecnico','visualizador');

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null default upper(substr(md5(gen_random_uuid()::text),1,8)),
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  full_name text,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  role public.app_role not null default 'visualizador',
  unique(user_id, company_id)
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  tag text not null,
  name text not null,
  manufacturer text,
  model text,
  serial text,
  status text not null default 'Operacional',
  criticality text not null default 'Média',
  team_id uuid references public.teams(id) on delete set null,
  location_id uuid references public.locations(id) on delete set null,
  qr_token text not null default encode(gen_random_bytes(9),'hex'),
  created_at timestamptz not null default now(),
  unique(company_id,tag),
  unique(company_id,qr_token)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  asset_id uuid references public.assets(id) on delete set null,
  title text not null,
  description text,
  priority text not null default 'Média',
  status text not null default 'Aberto',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.work_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  number bigint generated always as identity,
  asset_id uuid references public.assets(id) on delete set null,
  report_id uuid references public.reports(id) on delete set null,
  type text not null default 'Corretiva',
  priority text not null default 'Média',
  status text not null default 'Aberta',
  team_id uuid references public.teams(id) on delete set null,
  description text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.inspections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  result text not null default 'OK',
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_assets_company on public.assets(company_id);
create index if not exists idx_reports_company on public.reports(company_id);
create index if not exists idx_orders_company on public.work_orders(company_id);
create index if not exists idx_inspections_company on public.inspections(company_id);

create or replace function public.current_company_id()
returns uuid language sql stable security definer set search_path=public
as $$ select company_id from public.profiles where id=auth.uid() limit 1 $$;

create or replace function public.has_role(required_role public.app_role)
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.user_roles where user_id=auth.uid() and company_id=public.current_company_id() and role=required_role) $$;

alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.teams enable row level security;
alter table public.locations enable row level security;
alter table public.assets enable row level security;
alter table public.reports enable row level security;
alter table public.work_orders enable row level security;
alter table public.inspections enable row level security;

create policy "company self" on public.companies for select using (id=public.current_company_id());
create policy "profile self/company" on public.profiles for select using (id=auth.uid() or company_id=public.current_company_id());
create policy "roles same company" on public.user_roles for select using (company_id=public.current_company_id());
create policy "teams company" on public.teams for all using (company_id=public.current_company_id()) with check (company_id=public.current_company_id());
create policy "locations company" on public.locations for all using (company_id=public.current_company_id()) with check (company_id=public.current_company_id());
create policy "assets company" on public.assets for all using (company_id=public.current_company_id()) with check (company_id=public.current_company_id());
create policy "reports company" on public.reports for all using (company_id=public.current_company_id()) with check (company_id=public.current_company_id());
create policy "orders company" on public.work_orders for all using (company_id=public.current_company_id()) with check (company_id=public.current_company_id());
create policy "inspections company" on public.inspections for all using (company_id=public.current_company_id()) with check (company_id=public.current_company_id());

-- Bootstrap: create a company/profile/admin on first signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public
as $$
declare cid uuid;
begin
  cid := gen_random_uuid();
  insert into public.companies(id,name) values(cid, coalesce(new.raw_user_meta_data->>'company_name','Minha Empresa'));
  insert into public.profiles(id,company_id,full_name,email) values(new.id,cid,new.raw_user_meta_data->>'full_name',new.email);
  insert into public.user_roles(user_id,company_id,role) values(new.id,cid,'admin');
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();
