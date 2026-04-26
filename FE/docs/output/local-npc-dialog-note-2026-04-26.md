# Local NPC Dialog Note

## Summary

The add-agent flow was reshaped into a lightweight FE-only dialog for immediate prototype use.
This pass intentionally avoids backend changes and treats newly submitted NPCs as local additions layered on top of the backend-loaded roster.

## What changed

- `FE/app/src/sections/dialog/AddAgentDialogSection.tsx`
  - dialog inputs are now `name` and `persona`
  - `name` starts with a random default value when the dialog opens
- `FE/app/src/hooks/useAgentsPage.ts`
  - submit no longer calls the backend
  - local NPCs are appended into a separate FE state slice so late backend loads do not overwrite them
- `FE/app/src/App.test.tsx`
  - verifies random default name presence and successful local NPC append
- `FE/app/src/game/WorldCanvas.tsx`
  - relaxed Phaser typing for local build stability in this repo state

## Intent

Keep the NPC creation flow easy to demo right now without coupling the UI to unfinished backend write behavior.

## Scope boundaries preserved

- no backend contract changes
- no backend create request on submit
- backend-loaded roster still exists and remains readable
- locally created NPCs are FE-only for this pass

## Follow-up note

If the create flow later needs persistence, move the submit path back behind a dedicated FE service contract and reconcile the FE-only appended NPC state with the server-owned roster model.
