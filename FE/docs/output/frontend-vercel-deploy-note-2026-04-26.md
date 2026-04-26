# Frontend Vercel Deploy Note

## Summary

Switched the frontend deployment target from GitHub Pages to Vercel.

## Why

The repository did not have admin-level GitHub Pages setup access available in automation, while the backend already deploys through Vercel.
Using Vercel for the frontend keeps the deployment model consistent and removes the GitHub Pages bootstrap dependency.

## Important changes

- `.github/workflows/deploy-frontend.yml` now deploys to Vercel
- frontend deploy secrets are expected as `VERCEL_FRONTEND_ORG_ID` and `VERCEL_FRONTEND_PROJECT_ID`
- the Vite production base now defaults to `/`

## Follow-up

Create or link the frontend Vercel project and populate the frontend Vercel repository secrets before expecting the workflow to pass on GitHub Actions.
