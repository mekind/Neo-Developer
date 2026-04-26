# Frontend Stack Baseline

## Decision Summary

For the first pass, the frontend baseline is:

- **Build tool:** Vite
- **Language:** TypeScript
- **UI shell:** React
- **World rendering layer:** native HTML Canvas API
- **State strategy:** React state/context first
- **Quality tooling:** ESLint, Prettier, TypeScript strict mode
- **Test baseline:** Vitest

This is intentionally optimized for **fast-start**, not for full Gather.town parity.

## Why this baseline

### Vite + TypeScript
- fastest mainstream project bootstrap
- excellent DX for small-to-medium FE projects
- enough flexibility to grow later into a richer game/web hybrid

### React for the UI shell
- good fit for panels, overlays, chat UI, modal flows, settings, and future HUD-like elements
- keeps non-world UI easy to compose and maintain
- mainstream enough for onboarding speed

### Canvas for the world layer
- avoids committing to a heavy game engine too early
- still gives a clear path for 2D movement and interaction rendering
- keeps the first scaffold aligned with the `2d-world + interaction UI` direction

### React state/context first
- lowest-cost baseline while the scope is still small
- avoids selecting a bigger store before real state pressure exists
- can later evolve to Zustand if world/UI coordination becomes complex

## Explicit non-goals for this baseline

This first-pass stack intentionally does **not** optimize for:
- realtime multiplayer sync
- WebRTC voice/video
- login/profile/room systems
- backend integration strategy
- mobile-first UX
- heavy engine adoption

## What “done” means for this stack decision

- the stack choice is documented under `FE/`
- the project scaffold exists under `FE/app/`
- the scaffold makes it easy to start building a lightweight gather-like FE later

## Evolution guidance

If the project later needs stronger world simulation or more complex interaction loops, revisit:
- state strategy (`Zustand`)
- rendering path (`Canvas abstraction` or a lightweight 2D engine)
- network boundary (`TanStack Query` or custom sync layer once backend exists)
