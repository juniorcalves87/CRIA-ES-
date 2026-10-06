-- ELITE QR — SaaS 2: manual PIX billing + master owner bootstrap
create table if not exists public.company_billing_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade unique,
  pix_key text,
  pix_holder text,
  pix_bank text,
  pix_instructions text,
  updated_at timestamptz not null default now()
);
alter table public.company_billing_settings enable row level security;
create policy "billing settings manager read" on public.company_billing_settings for select using (company_id=public.current_company_id() and public.is_manager());
create policy "billing settings manager insert" on public.company_billing_settings for insert with check (company_id=public.current_company_id() and public.is_manager());
create policy "billing settings manager update" on public.company_billing_settings for update using (company_id=public.current_company_id() and public.is_manager()) with check (company_id=public.current_company_id() and public.is_manager());

create table if not exists public.plan_change_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  requested_plan_id uuid not null references public.saas_plans(id),
  billing_cycle text not null default 'monthly' check(billing_cycle in ('monthly','annual')),
  payment_method text not null default 'pix' check(payment_method in ('pix','manual')),
  status text not null default 'pending' check(status in ('pending','paid','approved','rejected','canceled')),
  requested_by uuid references auth.users(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.plan_change_requests enable row level security;
create policy "plan requests manager read" on public.plan_change_requests for select using (company_id=public.current_company_id() and public.is_manager());
create policy "plan requests manager insert" on public.plan_change_requests for insert with check (company_id=public.current_company_id() and public.is_manager() and requested_by=auth.uid());

create or replace function public.ensure_billing_settings(p_company_id uuid)
returns void language plpgsql security definer set search_path=public
as $$ begin
 insert into public.company_billing_settings(company_id) values(p_company_id)
 on conflict(company_id) do nothing;
end; $$;

create or replace function public.get_my_billing_settings()
returns table(pix_key text,pix_holder text,pix_bank text,pix_instructions text)
language sql stable security definer set search_path=public
as $$
select b.pix_key,b.pix_holder,b.pix_bank,b.pix_instructions
from public.company_billing_settings b
where b.company_id=public.current_company_id()
limit 1;
$$;

create or replace function public.save_my_pix_settings(
 p_pix_key text, p_pix_holder text default null, p_pix_bank text default null, p_pix_instructions text default null
)
returns boolean language plpgsql security definer set search_path=public
as $$
begin
 if not public.is_manager() then raise exception 'Apenas administradores/planejadores podem alterar o PIX'; end if;
 insert into public.company_billing_settings(company_id,pix_key,pix_holder,pix_bank,pix_instructions)
 values(public.current_company_id(),nullif(trim(p_pix_key),''),nullif(trim(p_pix_holder),''),nullif(trim(p_pix_bank),''),nullif(trim(p_pix_instructions),''))
 on conflict(company_id) do update set pix_key=excluded.pix_key,pix_holder=excluded.pix_holder,pix_bank=excluded.pix_bank,pix_instructions=excluded.pix_instructions,updated_at=now();
 return true;
end; $$;

grant execute on function public.ensure_billing_settings(uuid) to authenticated;
grant execute on function public.get_my_billing_settings() to authenticated;
grant execute on function public.save_my_pix_settings(text,text,text,text) to authenticated;

-- O e-mail mestre é pré-configurado como proprietário lógico do produto.
-- A senha NÃO é armazenada no banco nem no GitHub: o acesso é criado pelo fluxo normal
-- de cadastro/reset do Supabase Auth.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public
as $$
declare cid uuid; inv record; is_master boolean;
begin
  is_master := lower(coalesce(new.email,''))='juniorcalves87@gmail.com';
  select * into inv from public.company_invitations
  where token=coalesce(new.raw_user_meta_data->>'invite_token','')
    and accepted_at is null and expires_at>now() limit 1;
  if inv.id is not null then
    cid:=inv.company_id;
    insert into public.profiles(id,company_id,full_name,email) values(new.id,cid,new.raw_user_meta_data->>'full_name',new.email)
    on conflict(id) do update set email=excluded.email,full_name=excluded.full_name;
    insert into public.user_roles(user_id,company_id,role) values(new.id,cid,case when is_master then 'admin'::app_role else inv.role end)
    on conflict(user_id,company_id) do update set role=excluded.role;
    update public.company_invitations set accepted_at=now() where id=inv.id;
  else
    cid:=gen_random_uuid();
    insert into public.companies(id,name) values(cid,coalesce(new.raw_user_meta_data->>'company_name',case when is_master then 'ELITE QR' else 'Minha Empresa' end));
    insert into public.profiles(id,company_id,full_name,email) values(new.id,cid,new.raw_user_meta_data->>'full_name',new.email);
    insert into public.user_roles(user_id,company_id,role) values(new.id,cid,'admin');
    perform public.ensure_company_subscription(cid);
  end if;
  perform public.ensure_billing_settings(cid);
  return new;
end; $$;
