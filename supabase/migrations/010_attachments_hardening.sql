-- ELITE QR 010 — attachment metadata hardening
create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  entity_type text not null check (entity_type in ('asset','report','work_order','inspection')),
  entity_id uuid not null,
  storage_path text not null unique,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_attachments_company_entity on public.attachments(company_id,entity_type,entity_id);
alter table public.attachments enable row level security;
drop policy if exists "attachments select company" on public.attachments;
create policy "attachments select company" on public.attachments for select to authenticated using (company_id=public.current_company_id());
drop policy if exists "attachments create operators" on public.attachments;
create policy "attachments create operators" on public.attachments for insert to authenticated with check (company_id=public.current_company_id() and public.can_operate() and (created_by is null or created_by=auth.uid()));
drop policy if exists "attachments delete managers" on public.attachments;
create policy "attachments delete managers" on public.attachments for delete to authenticated using (company_id=public.current_company_id() and public.is_manager());
