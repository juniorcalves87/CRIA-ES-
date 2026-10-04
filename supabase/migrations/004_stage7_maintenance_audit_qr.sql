-- ELITE QR — Stage 7 production maintenance layer
create table if not exists public.work_order_updates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  status text,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  entity text not null,
  entity_id uuid,
  action text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_wo_updates_company on public.work_order_updates(company_id);
create index if not exists idx_wo_updates_order on public.work_order_updates(work_order_id);
create index if not exists idx_audit_company_created on public.audit_logs(company_id,created_at desc);

alter table public.work_order_updates enable row level security;
alter table public.audit_logs enable row level security;

create policy "wo updates select company"
on public.work_order_updates for select
using (company_id = public.current_company_id());

create policy "wo updates create operators"
on public.work_order_updates for insert
with check (
  company_id = public.current_company_id()
  and public.can_operate()
  and (created_by is null or created_by = auth.uid())
);

create policy "wo updates manage managers"
on public.work_order_updates for delete
using (company_id = public.current_company_id() and public.is_manager());

create policy "audit managers read"
on public.audit_logs for select
using (company_id = public.current_company_id() and public.is_manager());

create policy "audit operators write"
on public.audit_logs for insert
with check (
  company_id = public.current_company_id()
  and public.can_operate()
  and (user_id is null or user_id = auth.uid())
);

-- Public QR lookup exposes only non-sensitive asset fields.
create or replace function public.public_asset_by_qr(p_qr text)
returns table(tag text, name text, manufacturer text, model text, serial text, status text, criticality text, company_name text)
language sql stable security definer set search_path=public
as $$
  select a.tag,a.name,a.manufacturer,a.model,a.serial,a.status,a.criticality,c.name
  from public.assets a
  join public.companies c on c.id=a.company_id
  where a.qr_token=p_qr
  limit 1
$$;

grant execute on function public.public_asset_by_qr(text) to anon, authenticated;

-- Keep user profile metadata synchronized safely.
create or replace function public.update_my_profile(p_full_name text)
returns void
language sql security definer set search_path=public
as $$
  update public.profiles
  set full_name=nullif(trim(p_full_name),'')
  where id=auth.uid();
$$;

grant execute on function public.update_my_profile(text) to authenticated;
