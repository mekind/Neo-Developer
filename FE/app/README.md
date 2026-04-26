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
