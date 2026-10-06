-- ELITE QR — SaaS 3: master admin, payment approval, customer management, onboarding, recovery support

create table if not exists public.company_onboarding (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references public.companies(id) on delete cascade unique,
 industry text,
 city text,
 phone text,
 company_size text,
 objective text,
 completed boolean not null default false,
 step integer not null default 1,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.company_onboarding enable row level security;
create policy "onboarding company read" on public.company_onboarding for select using(company_id=public.current_company_id());
create policy "onboarding company insert" on public.company_onboarding for insert with check(company_id=public.current_company_id());
create policy "onboarding company update" on public.company_onboarding for update using(company_id=public.current_company_id()) with check(company_id=public.current_company_id());

create or replace function public.is_master_admin()
returns boolean language sql stable security definer set search_path=public
as $$ select lower(coalesce(auth.jwt()->>'email',''))='juniorcalves87@gmail.com'; $$;

create or replace function public.master_overview()
returns table(
 company_id uuid, company_name text, owner_email text, plan_code text, subscription_status text,
 trial_ends_at timestamptz, period_end timestamptz, users_count bigint, assets_count bigint,
 reports_month bigint, pending_requests bigint, onboarding_completed boolean
) language sql stable security definer set search_path=public
as $$
select c.id,c.name,
 coalesce((select p.email from profiles p join user_roles ur on ur.user_id=p.id and ur.company_id=c.id and ur.role='admin' order by p.created_at limit 1),(select p.email from profiles p where p.company_id=c.id order by p.created_at limit 1)) as owner_email,
 sp.code,cs.status,cs.trial_ends_at,cs.current_period_end,
 (select count(*) from profiles p where p.company_id=c.id),
 (select count(*) from assets a where a.company_id=c.id),
 (select count(*) from reports r where r.company_id=c.id and r.created_at>=date_trunc('month',now())),
 (select count(*) from plan_change_requests pr where pr.company_id=c.id and pr.status='pending'),
 coalesce((select o.completed from company_onboarding o where o.company_id=c.id),false)
from companies c
left join company_subscriptions cs on cs.company_id=c.id
left join saas_plans sp on sp.id=cs.plan_id
where public.is_master_admin()
order by c.created_at desc;
$$;

create or replace function public.master_payment_requests()
returns table(
 request_id uuid, company_id uuid, company_name text, requested_plan text, billing_cycle text,
 amount_cents integer, status text, requested_by_email text, created_at timestamptz, pix_key text
) language sql stable security definer set search_path=public
as $$
select r.id,c.id,c.name,p.code,r.billing_cycle,
 case when r.billing_cycle='annual' then p.annual_price_cents else p.monthly_price_cents end,
 r.status,pu.email,r.created_at,b.pix_key
from plan_change_requests r
join companies c on c.id=r.company_id
join saas_plans p on p.id=r.requested_plan_id
left join auth.users pu on pu.id=r.requested_by
left join company_billing_settings b on b.company_id=r.company_id
where public.is_master_admin()
order by r.created_at desc;
$$;

create or replace function public.master_approve_payment(p_request_id uuid, p_notes text default null)
returns boolean language plpgsql security definer set search_path=public
as $$
declare r plan_change_requests%rowtype;
begin
 if not public.is_master_admin() then raise exception 'Acesso mestre negado'; end if;
 select * into r from plan_change_requests where id=p_request_id for update;
 if r.id is null then raise exception 'Solicitação não encontrada'; end if;
 update company_subscriptions set plan_id=r.requested_plan_id,status='active',billing_cycle=r.billing_cycle,
 current_period_start=now(),current_period_end=case when r.billing_cycle='annual' then now()+interval '1 year' else now()+interval '1 month' end,
 trial_ends_at=null,canceled_at=null,provider='manual',updated_at=now()
 where company_id=r.company_id;
 update plan_change_requests set status='approved',notes=coalesce(p_notes,notes),updated_at=now() where id=r.id;
 return true;
end; $$;

create or replace function public.master_reject_payment(p_request_id uuid,p_notes text default null)
returns boolean language plpgsql security definer set search_path=public
as $$
begin
 if not public.is_master_admin() then raise exception 'Acesso mestre negado'; end if;
 update plan_change_requests set status='rejected',notes=coalesce(p_notes,notes),updated_at=now() where id=p_request_id;
 return found;
end; $$;

create or replace function public.master_set_plan(p_company_id uuid,p_plan_code text,p_billing_cycle text default 'monthly')
returns boolean language plpgsql security definer set search_path=public
as $$
declare pid uuid;
begin
 if not public.is_master_admin() then raise exception 'Acesso mestre negado'; end if;
 select id into pid from saas_plans where code=upper(p_plan_code) and active;
 if pid is null then raise exception 'Plano inválido'; end if;
 update company_subscriptions set plan_id=pid,status='active',billing_cycle=p_billing_cycle,
 current_period_start=now(),current_period_end=case when p_billing_cycle='annual' then now()+interval '1 year' else now()+interval '1 month' end,
 trial_ends_at=null,updated_at=now() where company_id=p_company_id;
 return found;
end; $$;

create or replace function public.save_my_onboarding(p_industry text,p_city text,p_phone text,p_company_size text,p_objective text,p_step integer,p_completed boolean)
returns boolean language plpgsql security definer set search_path=public
as $$
begin
 insert into company_onboarding(company_id,industry,city,phone,company_size,objective,step,completed)
 values(public.current_company_id(),nullif(trim(p_industry),''),nullif(trim(p_city),''),nullif(trim(p_phone),''),nullif(trim(p_company_size),''),nullif(trim(p_objective),''),greatest(1,p_step),p_completed)
 on conflict(company_id) do update set industry=excluded.industry,city=excluded.city,phone=excluded.phone,company_size=excluded.company_size,objective=excluded.objective,step=excluded.step,completed=excluded.completed,updated_at=now();
 return true;
end; $$;

create or replace function public.get_my_onboarding()
returns table(industry text,city text,phone text,company_size text,objective text,step integer,completed boolean)
language sql stable security definer set search_path=public
as $$ select industry,city,phone,company_size,objective,step,completed from company_onboarding where company_id=public.current_company_id() limit 1; $$;

grant execute on function public.is_master_admin() to authenticated;
grant execute on function public.master_overview() to authenticated;
grant execute on function public.master_payment_requests() to authenticated;
grant execute on function public.master_approve_payment(uuid,text) to authenticated;
grant execute on function public.master_reject_payment(uuid,text) to authenticated;
grant execute on function public.master_set_plan(uuid,text,text) to authenticated;
grant execute on function public.save_my_onboarding(text,text,text,text,text,integer,boolean) to authenticated;
grant execute on function public.get_my_onboarding() to authenticated;
