# Character Movement Interaction Note

## Summary

Adjusted the FE world prototype so the controllable avatar is always the user player,
while backend-provided agents stay separate NPCs inside the Phaser-backed commons map.

## What changed

- `FE/app/src/App.tsx`
  - separates player-avatar state from backend agent-roster state
  - keeps keyboard movement attached only to the user avatar
  - preserves the add-agent flow without handing player control to created NPCs
- `FE/app/src/game/agents.ts`
  - adds a dedicated player-avatar builder plus player-movement helpers
  - keeps backend agent placement/randomization helpers for NPCs
- `FE/app/src/game/WorldCanvas.tsx`
  - keeps the Phaser-backed world host
  - overlays the controllable player and NPC markers with nearby-interaction feedback
- `FE/app/src/components/InteractionPanel.tsx`
  - reframes the sidebar around “current player + backend agent roster + add agent”
- `FE/app/src/App.test.tsx`
  - locks the player-only movement contract
  - covers created agents appending as NPCs instead of replacing the player avatar

## Intent

The prototype should feel closer to the intended model:
the person entering the space controls their own avatar,
and backend-provided agents appear as NPCs rather than hijacking player input.

## Behavior contract

- the user avatar is always the active player
- the player moves with WASD or arrow keys
- generated agents are NPCs, not direct input targets
- interaction becomes available near a nearby agent NPC
- pressing `E` triggers visible interaction feedback

## Explicit scope boundary

Still intentionally excludes:

- multiplayer / realtime sync
- combat or complex progression rules
- visual polish / sprite animation push

## Follow-up notes

- movement responsiveness is the most important success bar for this pass
- Phaser currently remains the world surface owner; if deeper movement rules arrive later, keep player control state separate from backend agent roster state
- if richer world simulation appears later, consider extracting the local loop into dedicated world-state logic or scene-specific modules
