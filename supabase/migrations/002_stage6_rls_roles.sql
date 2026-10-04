-- ELITE QR — Stage 6 hardening
-- Role-aware RLS and secure company helpers.

create or replace function public.current_user_role()
returns public.app_role
language sql stable security definer set search_path=public
as $$
  select role
  from public.user_roles
  where user_id = auth.uid()
    and company_id = public.current_company_id()
  order by case role
    when 'admin' then 1
    when 'planejador' then 2
    when 'tecnico' then 3
    else 4 end
  limit 1
$$;

create or replace function public.is_manager()
returns boolean
language sql stable security definer set search_path=public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and company_id = public.current_company_id()
      and role in ('admin','planejador')
  )
$$;

create or replace function public.can_operate()
returns boolean
language sql stable security definer set search_path=public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and company_id = public.current_company_id()
      and role in ('admin','planejador','tecnico')
  )
$$;

-- Replace permissive policies with role-aware policies.
drop policy if exists "teams company" on public.teams;
drop policy if exists "locations company" on public.locations;
drop policy if exists "assets company" on public.assets;
drop policy if exists "reports company" on public.reports;
drop policy if exists "orders company" on public.work_orders;
drop policy if exists "inspections company" on public.inspections;

create policy "teams select company"
on public.teams for select
using (company_id = public.current_company_id());

create policy "teams manage managers"
on public.teams for all
using (company_id = public.current_company_id() and public.is_manager())
with check (company_id = public.current_company_id() and public.is_manager());

create policy "locations select company"
on public.locations for select
using (company_id = public.current_company_id());

create policy "locations manage managers"
on public.locations for all
using (company_id = public.current_company_id() and public.is_manager())
with check (company_id = public.current_company_id() and public.is_manager());

create policy "assets select company"
on public.assets for select
using (company_id = public.current_company_id());

create policy "assets manage managers"
on public.assets for all
using (company_id = public.current_company_id() and public.is_manager())
with check (company_id = public.current_company_id() and public.is_manager());

create policy "reports select company"
on public.reports for select
using (company_id = public.current_company_id());

create policy "reports create operators"
on public.reports for insert
with check (
  company_id = public.current_company_id()
  and public.can_operate()
  and (created_by is null or created_by = auth.uid())
);

create policy "reports manage managers"
on public.reports for update
using (company_id = public.current_company_id() and public.is_manager())
with check (company_id = public.current_company_id() and public.is_manager());

create policy "reports delete managers"
on public.reports for delete
using (company_id = public.current_company_id() and public.is_manager());

create policy "orders select company"
on public.work_orders for select
using (company_id = public.current_company_id());

create policy "orders manage managers"
on public.work_orders for all
using (company_id = public.current_company_id() and public.is_manager())
with check (company_id = public.current_company_id() and public.is_manager());

create policy "inspections select company"
on public.inspections for select
using (company_id = public.current_company_id());

create policy "inspections create operators"
on public.inspections for insert
with check (
  company_id = public.current_company_id()
  and public.can_operate()
  and (created_by is null or created_by = auth.uid())
);

create policy "inspections manage managers"
on public.inspections for update
using (company_id = public.current_company_id() and public.is_manager())
with check (company_id = public.current_company_id() and public.is_manager());

create policy "inspections delete managers"
on public.inspections for delete
using (company_id = public.current_company_id() and public.is_manager());

-- Company bootstrap helpers for the UI.
create or replace function public.my_company()
returns table(id uuid, name text, code text, role public.app_role)
language sql stable security definer set search_path=public
as $$
  select c.id, c.name, c.code, public.current_user_role()
  from public.companies c
  where c.id = public.current_company_id()
$$;

grant execute on function public.my_company() to authenticated;
grant execute on function public.current_company_id() to authenticated;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_manager() to authenticated;
grant execute on function public.can_operate() to authenticated;
