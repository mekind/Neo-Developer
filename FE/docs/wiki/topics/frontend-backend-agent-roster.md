# Frontend Backend Agent Roster

## Purpose

This page documents the first pass that replaces the FE-local world roster with backend-driven agents.
It exists so future agents can extend the world-occupant flow without re-deriving where backend roster fetching, fallback avatar handling, and per-load placement rules live.

## What changed

The frontend no longer treats locally created FE-only characters as the main world occupants.
Instead, it now:
- fetches a backend agent list from `/agents`
- maps backend agent records into world agents for the current load
- assigns each world agent a random position for that load
- keeps agents stationary after they appear
- allows new random positions after a reload
- falls back to a placeholder person icon when `imageAsset` is missing or disallowed
- replaces the old local-creation sidebar flow with a simple backend roster list

A small demo backend slice now exists as well:
- Nest module: `backend/src/agents/`
- route: `GET /agents`
- contract: `id` required, `name` optional, `imageAsset` optional

## Why this shape

The goal of this pass was to move the demo closer to a shared-world model without overbuilding persistence or richer avatar states.
The backend now owns who appears in the world, while the frontend owns how those backend entries are placed and rendered for the current load.

## Current file map

```text
backend/src/
├── agents/
│   ├── agents.controller.ts
│   ├── agents.module.ts
│   └── agents.service.ts
└── app.module.ts

FE/app/src/
├── components/
│   └── InteractionPanel.tsx
├── game/
│   ├── agents.ts
│   └── WorldCanvas.tsx
├── services/
│   └── agents.ts
└── App.tsx
```

## Responsibility split

### `backend/src/agents/`
- owns the demo backend roster source
- exposes the minimal read contract for frontend world agents
- currently returns hardcoded sample agents appropriate for prototype/demo use

### `FE/app/src/services/agents.ts`
- owns `/agents` response validation at the frontend boundary
- allows optional `name` and optional `imageAsset`
- rejects malformed payloads before UI state is updated

### `FE/app/src/game/agents.ts`
- owns FE-side agent mapping
- chooses random per-load positions
- keeps fallback placeholder logic in one place
- only accepts `data:image/*` or `https://` image sources; otherwise falls back to the placeholder icon

### `FE/app/src/components/InteractionPanel.tsx`
- no longer creates local characters
- now reflects backend roster load/error/list state in a simple sidebar shape

### `FE/app/src/game/WorldCanvas.tsx`
- renders backend-driven agents in the world viewport
- uses the mapped world-agent positions and image sources from the FE agent layer

## First-pass rules

- backend agents replace the old local roster
- positions are random on load, not persistent across reloads
- once rendered in a load, agents stay still
- missing or disallowed image sources use the placeholder avatar
- no richer avatar states yet
- sidebar stays a simple roster list, not a management UI

## Operational note

The new `/agents` endpoint is currently a demo/public-style read endpoint.
If the roster later becomes private or user-specific, auth and CORS policy should be revisited before treating this path as production-ready.

## Verification baseline

This pass was verified with:
- `FE/app: npm test`
- `FE/app: npm run lint`
- `FE/app: npm run build`
- `backend: npm run build`

Tests now cover:
- backend-driven shell/list rendering
- placeholder fallback for missing images
- allowlist fallback for disallowed image sources
- `id` fallback when `name` is missing
- per-build placement differences in the world-agent mapper
- config and backend-error states

## Follow-up guidance

When the next shared-world pass starts:
1. decide whether `/agents` remains public or becomes authenticated
2. decide whether placement should become deterministic or backend-owned
3. keep FE contract validation at the service boundary
4. expand avatar state only after the roster source/placement contract is stable

## Related
- [[Frontend API Integration Baseline]]([Frontend API Integration Baseline](frontend-api-integration-baseline.md))
- [[Frontend Project Bootstrap]]([Frontend Project Bootstrap](frontend-project-bootstrap.md))
- [[Frontend Architecture — MVVM + Clean Architecture]]([Frontend Architecture — MVVM + Clean Architecture](frontend-architecture-mvvm-clean.md))
- [[Frontend Wiki Index]]([Frontend Wiki Index](../_index.md))
