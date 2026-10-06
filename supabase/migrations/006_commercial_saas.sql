-- ELITE QR — Commercial SaaS layer
create table if not exists public.saas_plans (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  monthly_price_cents integer not null default 0,
  annual_price_cents integer not null default 0,
  max_users integer not null default 1,
  max_assets integer not null default 10,
  max_reports_month integer not null default 100,
  max_inspections_month integer not null default 100,
  max_storage_mb integer not null default 100,
  ai_enabled boolean not null default false,
  api_enabled boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.saas_plans
(code,name,description,monthly_price_cents,annual_price_cents,max_users,max_assets,max_reports_month,max_inspections_month,max_storage_mb,ai_enabled,api_enabled)
values
('START','Start','Para pequenas equipes de manutenção',0,0,3,50,300,300,500,false,false),
('PRO','Pro','Para operações industriais em crescimento',14900,149000,15,500,3000,3000,5000,true,true),
('INDUSTRIAL','Industrial','Para operações críticas e multiunidade',49900,499000,50,5000,20000,20000,50000,true,true)
on conflict(code) do update set
 name=excluded.name,description=excluded.description,monthly_price_cents=excluded.monthly_price_cents,
 annual_price_cents=excluded.annual_price_cents,max_users=excluded.max_users,max_assets=excluded.max_assets,
 max_reports_month=excluded.max_reports_month,max_inspections_month=excluded.max_inspections_month,
 max_storage_mb=excluded.max_storage_mb,ai_enabled=excluded.ai_enabled,api_enabled=excluded.api_enabled;

create table if not exists public.company_subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  plan_id uuid not null references public.saas_plans(id),
  status text not null default 'trialing' check(status in ('trialing','active','past_due','canceled','incomplete')),
  billing_cycle text not null default 'monthly' check(billing_cycle in ('monthly','annual')),
  provider text not null default 'manual',
  provider_customer_id text,
  provider_subscription_id text,
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id)
);

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  provider text not null,
  event_id text,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(provider,event_id)
);

alter table public.saas_plans enable row level security;
alter table public.company_subscriptions enable row level security;
alter table public.billing_events enable row level security;

create policy "plans public read" on public.saas_plans for select using (active=true);
create policy "subscription company read" on public.company_subscriptions for select using (company_id=public.current_company_id());
create policy "billing manager read" on public.billing_events for select using (company_id=public.current_company_id() and public.is_manager());

insert into public.company_subscriptions(company_id,plan_id,status,trial_ends_at,current_period_start,current_period_end)
select c.id,p.id,'trialing',now()+interval '14 days',now(),now()+interval '14 days'
from public.companies c cross join lateral (select id from public.saas_plans where code='START' limit 1) p
where not exists(select 1 from public.company_subscriptions s where s.company_id=c.id);

create or replace function public.ensure_company_subscription(p_company_id uuid)
returns void language plpgsql security definer set search_path=public
as $$
declare pid uuid;
begin
  if not exists(select 1 from public.company_subscriptions where company_id=p_company_id) then
    select id into pid from public.saas_plans where code='START' limit 1;
    insert into public.company_subscriptions(company_id,plan_id,status,trial_ends_at,current_period_start,current_period_end)
    values(p_company_id,pid,'trialing',now()+interval '14 days',now(),now()+interval '14 days');
  end if;
end; $$;

create or replace function public.company_entitlements()
returns table(
 company_id uuid, plan_code text, plan_name text, status text,
 max_users integer, max_assets integer, max_reports_month integer, max_inspections_month integer,
 max_storage_mb integer, ai_enabled boolean, api_enabled boolean,
 users_used bigint, assets_used bigint, reports_month_used bigint, inspections_month_used bigint
) language sql stable security definer set search_path=public
as $$
select c.id,p.code,p.name,s.status,p.max_users,p.max_assets,p.max_reports_month,p.max_inspections_month,p.max_storage_mb,p.ai_enabled,p.api_enabled,
 (select count(*) from public.profiles pr where pr.company_id=c.id),
 (select count(*) from public.assets a where a.company_id=c.id),
 (select count(*) from public.reports r where r.company_id=c.id and r.created_at>=date_trunc('month',now())),
 (select count(*) from public.inspections i where i.company_id=c.id and i.created_at>=date_trunc('month',now()))
from public.companies c
join public.company_subscriptions s on s.company_id=c.id
join public.saas_plans p on p.id=s.plan_id
where c.id=public.current_company_id()
limit 1;
$$;

create or replace function public.ensure_my_subscription()
returns table(ok boolean, plan_code text) language plpgsql security definer set search_path=public
as $$
declare cid uuid; pc text;
begin
 cid:=public.current_company_id();
 if cid is null then return query select false,null::text; return; end if;
 perform public.ensure_company_subscription(cid);
 select p.code into pc from public.company_subscriptions s join public.saas_plans p on p.id=s.plan_id where s.company_id=cid;
 return query select true,pc;
end; $$;

grant execute on function public.ensure_company_subscription(uuid) to authenticated;
grant execute on function public.company_entitlements() to authenticated;
grant execute on function public.ensure_my_subscription() to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public
as $$
declare cid uuid; inv record;
begin
  select * into inv from public.company_invitations
  where token=coalesce(new.raw_user_meta_data->>'invite_token','')
    and accepted_at is null and expires_at>now()
  limit 1;
  if inv.id is not null then
    cid:=inv.company_id;
    insert into public.profiles(id,company_id,full_name,email) values(new.id,cid,new.raw_user_meta_data->>'full_name',new.email);
    insert into public.user_roles(user_id,company_id,role) values(new.id,cid,inv.role)
    on conflict(user_id,company_id) do update set role=excluded.role;
    update public.company_invitations set accepted_at=now() where id=inv.id;
  else
    cid:=gen_random_uuid();
    insert into public.companies(id,name) values(cid,coalesce(new.raw_user_meta_data->>'company_name','Minha Empresa'));
    insert into public.profiles(id,company_id,full_name,email) values(new.id,cid,new.raw_user_meta_data->>'full_name',new.email);
    insert into public.user_roles(user_id,company_id,role) values(new.id,cid,'admin');
    perform public.ensure_company_subscription(cid);
  end if;
  return new;
end; $$;

create or replace function public.check_asset_limit()
returns trigger language plpgsql security definer set search_path=public
as $$
declare lim integer; used integer;
begin
 select p.max_assets into lim from public.company_subscriptions s join public.saas_plans p on p.id=s.plan_id where s.company_id=new.company_id and s.status in ('trialing','active');
 select count(*) into used from public.assets where company_id=new.company_id;
 if tg_op='INSERT' and used>=coalesce(lim,0) then raise exception 'Limite de equipamentos do plano atingido'; end if;
 return new;
end; $$;
drop trigger if exists trg_asset_plan_limit on public.assets;
create trigger trg_asset_plan_limit before insert on public.assets for each row execute function public.check_asset_limit();
