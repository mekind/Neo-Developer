# Character Movement Interaction Note

## Summary

Adjusted the FE world prototype so the controllable avatar is always the user player,
while generated agents are treated as separate NPCs in the world.

## What changed

- `FE/app/src/App.tsx`
  - separates player-avatar state from agent-NPC state
  - keeps keyboard movement attached only to the user avatar
  - treats nearby agents as interaction targets
- `FE/app/src/game/characters.ts`
  - adds explicit player vs agent character kinds
  - adds a dedicated player-avatar builder
- `FE/app/src/game/WorldCanvas.tsx`
  - labels player and NPC roles more clearly in the viewport
  - keeps nearby-agent interaction feedback focused on NPCs
- `FE/app/src/components/InteractionPanel.tsx`
  - reframes the sidebar copy around “user avatar + agent NPC roster”
- `FE/app/src/services/agents.ts`
  - adds the FE read path for loading agent NPCs from `/agents`
- `FE/app/src/App.test.tsx`
  - locks the player-only movement contract
  - covers agent creation without replacing the player avatar

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
- FE now assumes an agent-list read path exists at `/agents`; if backend rollout lags behind, the world should be expected to show an empty or errored NPC state
- if richer world simulation appears later, consider extracting the local loop into dedicated world-state logic
