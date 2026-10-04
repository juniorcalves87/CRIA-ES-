-- ELITE QR — unique team/location names per company for idempotent sync
create unique index if not exists uq_teams_company_name on public.teams(company_id,name);
create unique index if not exists uq_locations_company_name on public.locations(company_id,name);
