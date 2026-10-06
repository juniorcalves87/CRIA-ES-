# ELITE QR — Cloudflare Pages

## Objetivo

Nova camada de hospedagem do ELITE QR. O código continua no GitHub e o banco/autenticação continuam no Supabase.

### Arquitetura

- GitHub: código e versionamento
- Cloudflare Pages: frontend + HTTPS/CDN
- Supabase: PostgreSQL + Auth + Storage + RLS
- Cloudflare Workers: futuro backend seguro para webhooks, PIX e IA

### Publicação

Conecte o repositório GitHub ao Cloudflare Pages e configure:

- Production branch: `main`
- Build command: nenhum
- Build output directory: `elite-qr`

Alternativamente, o `wrangler.toml` permite publicação via Wrangler depois que uma conta Cloudflare estiver autenticada.

### Domínio

Comece com o subdomínio gratuito `*.pages.dev`. Quando houver domínio próprio, adicione o domínio personalizado no Cloudflare Pages sem alterar o código.

Exemplo: `elite-qr.pages.dev` → `app.eliteqr.com.br`

### Segurança

Nunca coloque Supabase service_role, tokens de pagamento, segredos OpenAI ou outros secrets no frontend. O navegador usa somente a chave pública/publishable do Supabase. Operações privilegiadas deverão ficar em Cloudflare Workers/Edge Functions.

### Migração

A publicação Cloudflare é uma camada de infraestrutura. O código não fica preso ao Cloudflare: pode ser levado para Vercel, Netlify ou infraestrutura própria posteriormente.
