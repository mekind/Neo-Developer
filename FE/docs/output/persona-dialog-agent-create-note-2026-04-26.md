# Persona Dialog Agent Create Note

## Summary

Replaced the old inline character-creation form with a button-triggered persona dialog.
The first pass now runs a full loop:
open dialog -> submit persona data to the backend -> spawn the returned character in the world immediately.

## What changed

- `FE/app/src/components/InteractionPanel.tsx`
  - removes the old inline `name + archetype` form as the primary create path
  - adds a modal-style persona dialog
  - collects:
    - persona summary
    - backstory / prompt
  - shows submit loading and error states
- `FE/app/src/App.tsx`
  - switches create behavior from local-only form append to API-backed creation
  - still owns the current world roster state for this prototype phase
- `FE/app/src/services/agents.ts`
  - adds the first frontend write-path service for agent creation
  - validates the returned payload shape before exposing it to the UI
- `FE/app/src/lib/api-client.ts`
  - now supports shared POST JSON transport in addition to GET
- `FE/app/src/game/characters.ts`
  - extracts reusable world-character placement/build logic
- `backend/src/agents/*`
  - adds a first-pass backend `/agents` endpoint used by the FE dialog flow

## Intent

This step moves the FE prototype from a purely local character stub toward a richer backend-backed agent-creation flow,
without expanding into a full agent-management system.

## Scope boundaries preserved

This first pass still does **not** include:

- avatar upload
- multi-step wizard creation
- edit-after-create flows
- agent history or management screens
- streaming/progress generation UI

## Current behavior contract

- users open the create flow from a dedicated button
- persona summary and backstory/prompt are required
- submit goes through the shared FE API layer
- a successful API response immediately produces a spawned world character
- failure stays local to the dialog as a visible submit error

## Follow-up notes

- backend agent creation is still mock/in-memory and should be revisited once persistence or real generation exists
- world-character mapping from API response is intentionally heuristic for the first pass
- if more write endpoints are added, keep endpoint-specific validation inside `services/` and keep `lib/api-client.ts` transport-only
