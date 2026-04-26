# Frontend API Integration Baseline

## Purpose

This page captures the first reusable frontend-to-backend integration pattern added after the initial FE bootstrap.
It exists so future agents can extend backend connectivity without re-deriving where config, transport, endpoint parsing, and UI consumption should live.

## What changed

The frontend now includes a minimal read-only API slice that:
- reads the backend base URL from `VITE_API_BASE_URL`
- fails closed when that env is missing
- fetches live `/items` data from the backend
- validates the `/items` response shape before exposing typed data to the UI
- renders the live-data proof inside `InteractionPanel`

It now also includes the first write-path slice for persona-based agent creation:
- shared POST transport in `lib/api-client.ts`
- endpoint-specific request/response validation in `services/agents.ts`
- dialog-driven submit UI in `InteractionPanel.tsx`
- immediate world-spawn mapping in `App.tsx`

## Why this shape

The goal of this first pass was not just to prove connectivity.
It was to leave behind a reusable pattern for future endpoint expansion while staying inside the current shell and avoiding extra dependencies.

## Current file map

```text
FE/app/src/
├── components/
│   └── InteractionPanel.tsx
├── config/
│   └── env.ts
├── lib/
│   └── api-client.ts
├── services/
│   ├── agents.ts
│   └── items.ts
└── vite-env.d.ts
```

## Responsibility split

### `config/env.ts`
- owns frontend runtime config lookup
- currently requires `VITE_API_BASE_URL`
- trims trailing slashes so endpoint joining stays predictable

### `lib/api-client.ts`
- owns shared fetch + HTTP error handling
- owns shared GET + POST JSON transport helpers
- returns `unknown` instead of pretending unchecked runtime typing is safe
- should stay transport-focused rather than endpoint-specific

### `services/items.ts`
- owns the `/items` endpoint boundary
- validates the response shape before returning typed `Item[]`
- is the current lightweight stand-in for a repository/data-access slice

### `services/agents.ts`
- owns the `/agents` write endpoint boundary
- validates the returned creation payload before returning typed data
- keeps persona-create details out of `App.tsx` and out of the generic transport layer

### `components/InteractionPanel.tsx`
- owns loading/error/render behavior for the first visible demo
- consumes typed item data rather than raw backend payloads
- keeps the proof inside the existing shell instead of redesigning layout
- now also owns the first persona dialog submit UX

## Constraints preserved in this first pass

- no CRUD UI yet
- no new dependencies
- no major UI redesign
- no auth / realtime work

## Operational note

The app now depends on `VITE_API_BASE_URL` being set.
If the env is missing, the UI shows a configuration error instead of silently calling a fallback backend.

## Verification baseline

The first pass was verified with:
- `npm test`
- `npm run lint`
- `npm run build`

Tests currently cover:
- successful live-item render
- backend error path
- missing-config path

## Follow-up guidance

The `/items` demo slice is no longer the main world-occupant flow.
The next durable step after this page is documented in [[Frontend Backend Agent Roster]]([Frontend Backend Agent Roster](frontend-backend-agent-roster.md)).


When the next API slice is added:
1. keep config lookup in `config/`
2. keep generic transport code in `lib/`
3. validate endpoint payloads in endpoint-specific files before exposing typed data
4. move toward an explicit `repository` naming/story if more backend slices appear

## Related
- [[Frontend Project Bootstrap]]([Frontend Project Bootstrap](frontend-project-bootstrap.md))
- [[Frontend Architecture — MVVM + Clean Architecture]]([Frontend Architecture — MVVM + Clean Architecture](frontend-architecture-mvvm-clean.md))
- [[Frontend Wiki Index]]([Frontend Wiki Index](../_index.md))
