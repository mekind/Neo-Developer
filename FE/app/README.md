# FE App

First-pass frontend scaffold for the project.

## Stack
- Vite
- TypeScript
- React
- Canvas placeholder for the 2D world layer

## Commands
- `npm install`
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run test`

## Deployment
- Vercel deploy workflow: `.github/workflows/deploy-frontend.yml`
- Trigger: push to `main` when `FE/app/**` changes, or manual dispatch
- Required repository secrets:
  - `VERCEL_TOKEN`
  - `VERCEL_FRONTEND_ORG_ID`
  - `VERCEL_FRONTEND_PROJECT_ID`
- The production Vite base defaults to `/` and can be overridden with `VITE_BASE_PATH` if a non-root deployment path is needed later.
- `VITE_API_BASE_URL` can be overridden per environment.
- Production CI injects `https://backend-kappa-brown-63.vercel.app` through `.github/workflows/deploy-frontend.yml`.
- FE also falls back to `https://backend-kappa-brown-63.vercel.app` when the env var is missing, so Vercel/dashboard rebuilds do not fail on missing config.
- Local development can still set the same value via `.env` / `.env.local` based on `.env.example`.
