# OpenClaw

MyClaw agent runtime. Stateless HTTP service running on Vercel (Next.js + AI SDK + AI Gateway).

See `../docs/openclaw/` for full architecture, API contract, and decisions.

## Endpoints

- `GET /api/health` — service status, backend reachability, ai gateway / default model presence
- `POST /api/invoke` — agent invocation (Phase 2)
- `POST /api/tick` — cron alert tick (Phase 6)

## Local development

```bash
cp .env.example .env.local
# fill in BACKEND_BASE_URL, BACKEND_SERVICE_TOKEN, AI_GATEWAY_API_KEY (or use mock)
pnpm install
pnpm dev   # http://localhost:3001
```

Health check:

```bash
curl http://localhost:3001/api/health
```

## Scripts

| Script | What |
|---|---|
| `pnpm dev` | dev server on port 3001 (Turbopack) |
| `pnpm build` | production build |
| `pnpm start` | production server on port 3001 |
| `pnpm typecheck` | TS check without emit |
| `pnpm vercel:link` | link this folder to a Vercel project (one-time) |
| `pnpm vercel:env:pull` | pull project env into `.env.local` |
| `pnpm vercel:deploy:preview` | manual preview deploy (pull → build → deploy prebuilt) |
| `pnpm vercel:deploy:prod` | manual production deploy |

The `vercel:*` scripts assume `vercel` CLI is installed globally (`npm i -g vercel`) and `pnpm vercel:link` has been run once.

## Deployment

Vercel project root directory must be `openclaw` (relative to repo root). Setup details in `../docs/openclaw/setup-guide.md`.

### CI/CD

| Workflow | Trigger | Purpose |
|---|---|---|
| `.github/workflows/ci-openclaw.yml` | PR / push to `main`, `kds` touching `openclaw/**` | typecheck + build |
| `.github/workflows/deploy-openclaw.yml` | push to `main` touching `openclaw/**`, manual dispatch | production deploy via Vercel CLI |

Required GitHub Secrets:

| Secret | Use |
|---|---|
| `VERCEL_TOKEN` | shared with backend/frontend, can reuse |
| `VERCEL_OPENCLAW_ORG_ID` | OpenClaw Vercel project org |
| `VERCEL_OPENCLAW_PROJECT_ID` | OpenClaw Vercel project ID |

> Preview deploys are handled automatically by Vercel's git integration once the project is linked — no GHA needed.

## Project layout

```
openclaw/
├─ src/
│  └─ app/
│     ├─ page.tsx           # API index stub
│     ├─ layout.tsx
│     └─ api/
│        ├─ health/route.ts
│        ├─ invoke/route.ts # (Phase 2)
│        └─ tick/route.ts   # (Phase 6)
├─ vercel.json              # framework + crons
├─ .env.example
└─ package.json
```
