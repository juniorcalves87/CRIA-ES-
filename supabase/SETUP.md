# ELITE QR — Supabase Production Setup

## Migration order
Run these files in the Supabase SQL Editor, in order:

1. `001_elite_qr_foundation.sql`
2. `002_stage6_rls_roles.sql`
3. `003_stage6_invitations.sql`
4. `004_stage7_maintenance_audit_qr.sql`
5. `005_stage7_unique_dimensions.sql`

All migrations are idempotent where practical.

## Browser credentials
The ELITE QR browser only needs:
- Supabase Project URL
- Supabase publishable/anon key

Never put a service_role/secret key in the browser.

## Authentication
The first normal signup creates:
- a company
- a profile
- an admin role

Invited users can join an existing company using an invitation token in their signup metadata.

## RLS model
- admin / planejador: manage assets, teams, locations, work orders and manager functions.
- tecnico: create reports and inspections and operate maintenance workflows.
- visualizador: read company data.
- every business table is scoped by `company_id`.

## Public QR
The QR URL can resolve an equipment through the `public_asset_by_qr` RPC without exposing private company records. Only equipment display fields are returned.

## Deployment
The frontend is deployed by GitHub Actions to GitHub Pages.
