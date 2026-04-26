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

## Deployment

Vercel project root directory must be `AIM/openclaw`. See `../docs/openclaw/setup-guide.md`.

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
