# Deploy — Produção (VPS Pulso)

Elite Match evoluiu de protótipo (localStorage) para app **full-stack real**:
TanStack Start (SSR/Nitro) + **Postgres dedicado** + **auth por OTP (WhatsApp via
Evolution API)** + server functions serverless. Roda na VPS sob **pm2**, atrás do
nginx.

- **Runtime:** Node 24 · **Pkg manager:** bun · **Preset Nitro:** `node-server`
- **Serviço pm2:** `elite-match` · **Porta:** `127.0.0.1:3071`
- **Banco:** Postgres 16 em docker (`elite-match-db`, `127.0.0.1:5435`)
- **OTP:** Evolution API (instância `trion-cold`), fallback e-mail logado

## Arquitetura

```
Cliente (mobile) ─┐
Corretor  ────────┤  nginx ──► pm2 elite-match :3071 (SSR + /_serverFn RPC)
                  │                         │
                  │                         ├─► Postgres elite-match-db :5435
                  │                         └─► Evolution API :8083 (OTP WhatsApp)
```

Rotas: `/` cadastro do lead (+OTP) · `/feed` swipe · `/corretor` painel (login OTP).
Server functions em `src/lib/api.ts` (fora de `**/server/**` por causa do
import-protection do TanStack). Camadas server-only: `src/lib/{db,auth,evolution}.server.ts`.

## Subir do zero na VPS

```sh
# 1. Banco dedicado
cp .env.example .env         # e preencha os segredos (POSTGRES_PASSWORD, SESSION_SECRET, EVOLUTION_APIKEY...)
docker compose -f db/docker-compose.db.yml --env-file .env up -d
docker exec -i elite-match-db psql -U elitematch -d elitematch < db/schema.sql
docker exec -i elite-match-db psql -U elitematch -d elitematch < db/seed.sql   # 6 imóveis demo
# corretor admin:
docker exec -i elite-match-db psql -U elitematch -d elitematch \
  -c "insert into usuarios (nome,whatsapp,papel) values ('Corretor Elite','556199449983','corretor') on conflict (whatsapp) do update set papel='corretor';"

# 2. Build + serviço
bun install
NITRO_PRESET=node-server bun run build
pm2 start ecosystem.config.cjs        # NÃO use --update-env (quebra o keyring do gog)
pm2 save
```

## Redeploy (após mudanças)

```sh
bun install
NITRO_PRESET=node-server bun run build
pm2 restart elite-match               # sem --update-env
```

## Teste E2E (smoke)

Sobe o servidor e roda os testes no mesmo shell (o sandbox reapa processos entre calls):

```sh
set -a; . ./.env; set +a; PORT=3071 node .output/server/index.mjs & SRV=$!
bun scripts/e2e-smoke.mjs             # semeia OTPs no banco, valida o fluxo real
kill $SRV
```

Cobre: emissão de OTP, rejeição de código errado, cadastro+sessão, `me()`, feed do
banco, persistência de like, login de corretor, visibilidade do painel e o guard
`requireCorretor`.

## nginx (expor publicamente)

Ver `deploy/nginx-elite-match.conf`. Ajuste `server_name` para o domínio final,
crie o certificado (certbot) e aponte o DNS. **Defina `PUBLIC_ORIGIN=https://<dominio>`
no `.env`** (habilita cookie `secure`) e rebuilde.

## Legado — Vercel

Deploy anterior (protótipo estático/SSR sem backend) em
https://elite-match-properties.vercel.app/. Para voltar à Vercel seria preciso um
Postgres acessível pela Vercel (ex.: Neon/Supabase) — a versão atual usa o Postgres
local da VPS, então o alvo de produção é a própria VPS.
