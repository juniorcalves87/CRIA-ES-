-- ELITE QR 009 — hardening comercial e limites
-- Compatível com o schema operacional existente. Não apaga dados.

create or replace function public.enforce_plan_limits()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare c uuid; p public.saas_plans%rowtype; n integer;
begin
 c := coalesce(new.company_id, public.current_company_id());
 perform public.ensure_company_subscription(c);
 select sp.* into p from public.company_subscriptions cs join public.saas_plans sp on sp.id=cs.plan_id where cs.company_id=c;
 if TG_TABLE_NAME='assets' then
   select count(*) into n from public.assets where company_id=c;
   if n >= p.max_assets then raise exception 'Limite de equipamentos do plano % atingido (%).',p.name,p.max_assets; end if;
 elsif TG_TABLE_NAME='reports' then
   select count(*) into n from public.reports where company_id=c and created_at >= date_trunc('month',now());
   if n >= p.max_reports_month then raise exception 'Limite mensal de relatos do plano % atingido (%).',p.name,p.max_reports_month; end if;
 elsif TG_TABLE_NAME='inspections' then
   select count(*) into n from public.inspections where company_id=c and started_at >= date_trunc('month',now());
   if n >= p.max_inspections_month then raise exception 'Limite mensal de inspeções do plano % atingido (%).',p.name,p.max_inspections_month; end if;
 end if;
 return new;
end $$;

drop trigger if exists trg_plan_asset_limit on public.assets;
create trigger trg_plan_asset_limit before insert on public.assets for each row execute function public.enforce_plan_limits();

drop trigger if exists trg_plan_report_limit on public.reports;
create trigger trg_plan_report_limit before insert on public.reports for each row execute function public.enforce_plan_limits();

drop trigger if exists trg_plan_inspection_limit on public.inspections;
create trigger trg_plan_inspection_limit before insert on public.inspections for each row execute function public.enforce_plan_limits();

create index if not exists idx_reports_company_month on public.reports(company_id,created_at);
create index if not exists idx_inspections_company_month on public.inspections(company_id,started_at);
create index if not exists idx_assets_company_tag on public.assets(company_id,tag);
create index if not exists idx_orders_company_status on public.work_orders(company_id,status);
create index if not exists idx_plan_requests_company_status on public.plan_change_requests(company_id,status);

-- Funções de exportação somente do tenant atual. O frontend pode usar estas
-- RPCs futuramente para exportação server-side sem expor outras empresas.
create or replace function public.export_company_snapshot()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare c uuid:=public.current_company_id();
begin
 return jsonb_build_object(
  'version','1.0',
  'exported_at',now(),
  'company_id',c,
  'assets',coalesce((select jsonb_agg(to_jsonb(x)) from public.assets x where x.company_id=c),'[]'::jsonb),
  'reports',coalesce((select jsonb_agg(to_jsonb(x)) from public.reports x where x.company_id=c),'[]'::jsonb),
  'work_orders',coalesce((select jsonb_agg(to_jsonb(x)) from public.work_orders x where x.company_id=c),'[]'::jsonb),
  'inspections',coalesce((select jsonb_agg(to_jsonb(x)) from public.inspections x where x.company_id=c),'[]'::jsonb),
  'teams',coalesce((select jsonb_agg(to_jsonb(x)) from public.teams x where x.company_id=c),'[]'::jsonb),
  'locations',coalesce((select jsonb_agg(to_jsonb(x)) from public.locations x where x.company_id=c),'[]'::jsonb)
 );
end $$;
grant execute on function public.export_company_snapshot() to authenticated;
