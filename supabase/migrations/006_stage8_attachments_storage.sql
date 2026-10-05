-- ELITE QR — Stage 8 attachments / storage
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

create index if not exists idx_attachments_company on public.attachments(company_id,created_at desc);
create index if not exists idx_attachments_entity on public.attachments(company_id,entity_type,entity_id);

alter table public.attachments enable row level security;

create policy "attachments select company"
on public.attachments for select to authenticated
using (company_id = public.current_company_id());

create policy "attachments insert operators"
on public.attachments for insert to authenticated
with check (
  company_id = public.current_company_id()
  and public.can_operate()
  and (created_by is null or created_by = auth.uid())
);

create policy "attachments delete managers"
on public.attachments for delete to authenticated
using (company_id = public.current_company_id() and public.is_manager());

-- Private bucket. Files remain inaccessible without authenticated Storage policies.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values (
  'elite-qr',
  'elite-qr',
  false,
  5242880,
  array['image/jpeg','image/png','image/webp','application/pdf']
)
on conflict (id) do update set
  public=false,
  file_size_limit=5242880,
  allowed_mime_types=array['image/jpeg','image/png','image/webp','application/pdf'];

create policy "elite qr storage read company"
on storage.objects for select to authenticated
using (
  bucket_id='elite-qr'
  and (storage.foldername(name))[1] = public.current_company_id()::text
);

create policy "elite qr storage upload operators"
on storage.objects for insert to authenticated
with check (
  bucket_id='elite-qr'
  and public.can_operate()
  and (storage.foldername(name))[1] = public.current_company_id()::text
);

create policy "elite qr storage update operators"
on storage.objects for update to authenticated
using (
  bucket_id='elite-qr'
  and public.can_operate()
  and (storage.foldername(name))[1] = public.current_company_id()::text
)
with check (
  bucket_id='elite-qr'
  and public.can_operate()
  and (storage.foldername(name))[1] = public.current_company_id()::text
);

create policy "elite qr storage delete managers"
on storage.objects for delete to authenticated
using (
  bucket_id='elite-qr'
  and public.is_manager()
  and (storage.foldername(name))[1] = public.current_company_id()::text
);

grant select,insert,delete on public.attachments to authenticated;
