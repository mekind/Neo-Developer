# NeoD-style Minimap Controls Note

## Summary

Adjusted the FE shared-space prototype to follow the referenced NeoD interaction feel more closely:
arrow the control scheme to arrow-key movement, trigger nearby NPC interaction with the spacebar, and expose a top-right minimap above the Phaser viewport.

## What changed

- `FE/app/src/hooks/useAgentsPage.ts`
  - uses arrow-key-only movement input
  - switches nearby interaction from `E` to `Space`
- `FE/app/src/game/WorldCanvas.tsx`
  - adds a minimap overlay that tracks the player, NPC agents, and the current viewport focus
  - updates world prompts to the new control scheme
- `FE/app/src/sections/map/MapSection.tsx`
  - updates the map copy to describe the NeoD-like control layer
- `FE/app/src/sections/sidebar/SidebarSection.tsx`
  - updates the sidebar control instructions
- `FE/app/src/App.test.tsx`
  - verifies the new copy and the spacebar interaction path

## Behavior contract

- move with arrow keys only
- interact with the nearest in-range agent using `Space`
- show a minimap in the map viewport
- keep React in charge of high-level UI while Phaser owns the world surface
