# ELITE QR — Supabase Production Setup

## Migration order
Run these files in the Supabase SQL Editor, in order:

1. `001_elite_qr_foundation.sql`
2. `002_stage6_rls_roles.sql`
3. `003_stage6_invitations.sql`
4. `004_stage7_maintenance_audit_qr.sql`
5. `005_stage7_unique_dimensions.sql`
6. `006_commercial_saas.sql`
7. `007_saas2_pix_master.sql`
8. `008_saas3_master_onboarding.sql`
9. `009_saas_hardening_import_export.sql`
10. `010_attachments_hardening.sql`
11. `011_seller_pix_master.sql`
12. `012_security_definer_paths.sql`
13. `013_security_compatibility.sql`

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


## 010–013 — Produção e hardening
As migrations 010–013 adicionam anexos/Storage com RLS, PIX do produto (vendedor), correções do painel mestre e compatibilidade de funções SECURITY DEFINER. Execute-as após 009.

## 006 — SaaS comercial
Após as migrations 001–005, execute `006_commercial_saas.sql`. Ela cria catálogo de planos Start/Pro/Industrial, assinatura por empresa, entitlements/limites, medição de uso e preparação para provedor de cobrança. O navegador nunca recebe chaves secretas. A integração de checkout/webhook deve ser feita por backend/Edge Function.

## 007 — SaaS 2: PIX manual + proprietário mestre
Execute `007_saas2_pix_master.sql` após 006.

- A chave PIX é cadastrada manualmente pelo botão **⚙ PIX** dentro do sistema.
- A chave não é gravada no código-fonte nem no GitHub.
- Upgrades geram uma solicitação de plano e exibem a chave PIX cadastrada.
- O e-mail proprietário/mestre reservado é **juniorcalves87@gmail.com**.
- A senha nunca é criada nem armazenada pelo projeto; o acesso usa o Supabase Auth. Faça o primeiro cadastro/reset desse e-mail no Supabase para definir a senha.

## 008 — SaaS 3: administração mestre e onboarding
Execute `008_saas3_master_onboarding.sql` após 007. Ela adiciona painel mestre, aprovação/rejeição de pagamentos PIX, alteração manual de plano, gestão resumida de clientes, onboarding da empresa e recuperação de senha via Supabase Auth.

**Administrador mestre:** `juniorcalves87@gmail.com`. O banco reconhece esse e-mail para as funções mestre; a senha permanece exclusivamente no Supabase Auth.


## 009 — Nova hospedagem Cloudflare

A hospedagem recomendada do ELITE QR passa a ser Cloudflare Pages, mantendo GitHub como fonte do código e Supabase como banco/Auth/Storage. O frontend está em `elite-qr/` e inclui `_headers`, `_redirects` e `wrangler.toml` para a camada Cloudflare.

Para publicação gratuita, conecte o repositório ao Cloudflare Pages com branch `main`, sem build command e output directory `elite-qr`. O projeto receberá um endereço `pages.dev`. Depois, um domínio `.com.br` pode ser conectado sem alterar o aplicativo.

Também foi preparado `.github/workflows/cloudflare-pages.yml` para publicação automática via GitHub Actions. Esse fluxo exige apenas os secrets `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID`; eles não devem ser gravados no código.
