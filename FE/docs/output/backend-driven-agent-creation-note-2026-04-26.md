# Backend-Driven Agent Creation Note

## Summary

Replaced the prototype's immediate local character spawn loop with a backend-driven agent creation flow:
open a dialog, submit to the backend, show a pending placeholder on the main screen, and only mark the agent as fully created after backend image generation succeeds.

## What changed

- `FE/app/src/App.tsx`
  - moved creation orchestration to an async backend-backed flow
  - inserts a pending placeholder immediately after submit
  - replaces the pending placeholder with the final backend agent on success
  - removes the pending placeholder and surfaces an error on failure
- `FE/app/src/components/InteractionPanel.tsx`
  - replaces the inline creation form with a dialog-based create entry point
  - keeps first-pass loading and error messaging local to the panel
  - updates the summary/list copy to distinguish pending vs complete agents
- `FE/app/src/game/WorldCanvas.tsx`
  - reflects pending vs complete state in world status and roster rendering
  - shows generated avatars when backend creation succeeds
- `FE/app/src/game/characters.ts`
  - adds shared pending/ready agent state helpers and backend-created agent mapping
- `FE/app/src/services/agents.ts`
  - adds the typed frontend `/agents` creation service
- `backend/src/agents/*`
  - adds a NestJS agent-creation slice that returns an in-memory created agent plus generated SVG avatar data
- `FE/app/src/App.test.tsx`
  - replaces the old immediate-spawn assertions with dialog/pending/success/failure flow coverage

## Why it changed

The earlier prototype treated local UI insertion as the creation boundary.
That no longer matches the intended product flow.
For this pass, backend completion and generated image availability define when an agent is actually created.

## Scope boundary

This first pass intentionally does **not** add:

- broad UI redesign outside the create flow
- realtime progress streaming
- edit/delete management
- retry/history/job-tracking surfaces

## Current behavior contract

- users open a create-agent dialog instead of filling an inline panel form
- submit sends the request to the backend
- the main screen shows a pending placeholder while backend work is in flight
- the UI does not present the pending agent as fully created
- backend success transitions the placeholder into a final main-screen agent with generated avatar data

## Follow-up notes

- backend persistence is still in-memory only
- image generation is currently represented by generated SVG data URLs rather than an external image model
- if richer agent lifecycle controls are added later, revisit whether pending/ready state should move out of `App.tsx` into a dedicated state boundary
