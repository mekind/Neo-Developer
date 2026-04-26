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
- GitHub Pages deploy workflow: `.github/workflows/deploy-frontend.yml`
- Trigger: push to `main` when `FE/app/**` changes, or manual dispatch
- Production builds automatically use the repository-name base path so the Vite app works on GitHub Pages project URLs

- The workflow auto-enables GitHub Pages during setup so first-time deployments do not fail on repositories without a pre-created Pages site.
