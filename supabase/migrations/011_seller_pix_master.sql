-- ELITE QR 011 — seller PIX settings and master payment hardening
create table if not exists public.product_billing_settings (
  id smallint primary key default 1 check(id=1),
  pix_key text,
  pix_holder text,
  pix_bank text,
  pix_instructions text,
  updated_at timestamptz not null default now()
);
alter table public.product_billing_settings enable row level security;

create or replace function public.get_product_pix_settings()
returns table(pix_key text,pix_holder text,pix_bank text,pix_instructions text)
language sql stable security definer set search_path=''
as $$
select p.pix_key,p.pix_holder,p.pix_bank,p.pix_instructions
from public.product_billing_settings p
where p.id=1
limit 1
$$;

create or replace function public.save_product_pix_settings(p_pix_key text,p_pix_holder text default null,p_pix_bank text default null,p_pix_instructions text default null)
returns boolean
language plpgsql security definer set search_path=''
as $$
begin
if not public.is_master_admin() then raise exception 'Acesso mestre negado'; end if;
insert into public.product_billing_settings(id,pix_key,pix_holder,pix_bank,pix_instructions,updated_at)
values(1,nullif(trim(p_pix_key),''),nullif(trim(p_pix_holder),''),nullif(trim(p_pix_bank),''),nullif(trim(p_pix_instructions),''),now())
on conflict(id) do update set pix_key=excluded.pix_key,pix_holder=excluded.pix_holder,pix_bank=excluded.pix_bank,pix_instructions=excluded.pix_instructions,updated_at=now();
return true;
end
$$;

grant execute on function public.get_product_pix_settings() to authenticated;
grant execute on function public.save_product_pix_settings(text,text,text,text) to authenticated;
revoke execute on function public.get_product_pix_settings() from public,anon;
revoke execute on function public.save_product_pix_settings(text,text,text,text) from public,anon;

create or replace function public.master_set_plan(p_company_id uuid,p_plan_code text,p_billing_cycle text default 'monthly')
returns boolean
language plpgsql security definer set search_path=''
as $$
declare pid uuid;
begin
if not public.is_master_admin() then raise exception 'Acesso mestre negado'; end if;
if p_billing_cycle not in ('monthly','annual') then raise exception 'Ciclo inválido'; end if;
select id into pid from public.saas_plans where code=upper(p_plan_code) and active;
if pid is null then raise exception 'Plano inválido'; end if;
perform public.ensure_company_subscription(p_company_id);
update public.company_subscriptions
set plan_id=pid,status='active',billing_cycle=p_billing_cycle,current_period_start=now(),
current_period_end=case when p_billing_cycle='annual' then now()+interval '1 year' else now()+interval '1 month' end,
trial_ends_at=null,canceled_at=null,updated_at=now()
where company_id=p_company_id;
return found;
end
$$;

grant execute on function public.master_set_plan(uuid,text,text) to authenticated;
