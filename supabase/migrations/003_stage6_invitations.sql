-- ELITE QR — Stage 6 multi-company invitations
create table if not exists public.company_invitations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  email text not null,
  role public.app_role not null default 'tecnico',
  token text not null unique default encode(gen_random_bytes(24),'hex'),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_company_invitations_token on public.company_invitations(token);
create index if not exists idx_company_invitations_company on public.company_invitations(company_id);

alter table public.company_invitations enable row level security;

create policy "invitations managers read"
on public.company_invitations for select
using (company_id = public.current_company_id() and public.is_manager());

create or replace function public.create_company_invite(invite_email text, invite_role public.app_role default 'tecnico')
returns table(token text, company_id uuid, expires_at timestamptz)
language plpgsql security definer set search_path=public
as $$
declare cid uuid;
begin
  if not public.is_manager() then
    raise exception 'not authorized';
  end if;
  cid := public.current_company_id();
  if cid is null then raise exception 'company not found'; end if;
  return query
  insert into public.company_invitations(company_id,email,role,created_by)
  values(cid,lower(trim(invite_email)),invite_role,auth.uid())
  returning company_invitations.token, company_invitations.company_id, company_invitations.expires_at;
end;
$$;

grant execute on function public.create_company_invite(text, public.app_role) to authenticated;

-- Update bootstrap: an invitation joins an existing company; a normal signup creates a new company.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public
as $$
declare
  cid uuid;
  inv public.company_invitations%rowtype;
  invite_token text;
  requested_email text;
begin
  requested_email := lower(coalesce(new.email,''));
  invite_token := nullif(new.raw_user_meta_data->>'invite_token','');

  if invite_token is not null then
    select * into inv
    from public.company_invitations
    where token = invite_token
      and accepted_at is null
      and expires_at > now()
      and lower(email) = requested_email
    limit 1;

    if not found then
      raise exception 'invalid or expired company invitation';
    end if;

    cid := inv.company_id;

    insert into public.profiles(id,company_id,full_name,email)
    values(new.id,cid,new.raw_user_meta_data->>'full_name',new.email);

    insert into public.user_roles(user_id,company_id,role)
    values(new.id,cid,inv.role)
    on conflict (user_id,company_id) do update set role=excluded.role;

    update public.company_invitations
    set accepted_at=now()
    where id=inv.id;
  else
    cid := gen_random_uuid();

    insert into public.companies(id,name)
    values(cid,coalesce(new.raw_user_meta_data->>'company_name','Minha Empresa'));

    insert into public.profiles(id,company_id,full_name,email)
    values(new.id,cid,new.raw_user_meta_data->>'full_name',new.email);

    insert into public.user_roles(user_id,company_id,role)
    values(new.id,cid,'admin');
  end if;

  return new;
end;
$$;

drop policy if exists "invitations create managers" on public.company_invitations;

create policy "invitations create managers"
on public.company_invitations for insert
with check (company_id = public.current_company_id() and public.is_manager());

create policy "invitations delete managers"
on public.company_invitations for delete
using (company_id = public.current_company_id() and public.is_manager());
