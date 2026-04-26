# World Camera Minimap Note

## Summary

Adjusted the FE world viewport so the user starts at the center of the room,
the main Phaser camera follows that player,
and the game now includes a true in-canvas minimap that shows the full commons layout.

## What changed

- `FE/app/src/game/agents.ts`
  - moves the initial player spawn to the center of the room (`50%, 50%`)
- `FE/app/src/game/WorldCanvas.tsx`
  - promotes player and NPC markers into Phaser-rendered world objects
  - makes the main camera follow the player instead of showing the whole room statically
  - adds a second Phaser camera as a real minimap overlay for the full room
- `FE/app/src/styles/global.css`
  - removes the old DOM marker overlay styling
  - adds lightweight HUD styling for the minimap badge
- `FE/app/src/App.test.tsx`
  - updates player-start and interaction expectations to the centered spawn contract

## Intent

The previous world surface could look visually detached because Phaser rendered the room,
while React DOM overlays rendered the player and NPC markers on top.
This pass makes the stage feel more like a game camera:
main play happens in the followed camera,
and room awareness comes from a dedicated minimap inside the game surface.

## Behavior contract

- the user starts from the center of the room
- the main camera follows the player during movement
- the minimap is a real Phaser camera, not a separate DOM pseudo-map
- the minimap always shows the full room layout
- nearby interaction feedback still uses the closest NPC to the player position

## Follow-up notes

- if richer sprites or animation are added later, keep them inside Phaser so the main view and minimap stay visually consistent
- if the room grows beyond the current prototype size, revisit minimap zoom and placement so it stays readable on smaller screens
