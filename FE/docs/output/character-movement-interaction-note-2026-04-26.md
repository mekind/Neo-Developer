# Character Movement Interaction Note

## Summary

Extended the FE world prototype from spawn-only avatars to a first playable loop:
create a character, move the latest-created avatar, then interact with nearby generated characters.
The world stage now behaves more like the NeoD reference direction: React frames the page, while the map itself is treated as a dedicated game canvas surface.

## What changed

- `FE/app/src/App.tsx`
  - keeps the latest created character as the controllable player
  - treats the world area as a Phaser-backed map host instead of a React-drawn canvas
- `FE/app/src/game/characters.ts`
  - centralizes larger world sizing, spawn points, interaction range, and obstacle helpers
- `FE/app/src/game/WorldCanvas.tsx`
  - mounts a Phaser game into the world viewport
  - renders a larger map surface, camera-follow movement, and proximity interaction feedback
- `FE/app/src/App.test.tsx`
  - preserves spawn/append behavior tests
  - mocks the Phaser world host while keeping movement + interaction loop coverage
- `FE/app/package.json`
  - adds Phaser as the dedicated world/canvas runtime

## Intent

The prototype should now feel like a tiny Gather-style playable slice rather than a static character placement demo, and the map should be architecturally closer to a real game surface than a UI-only drawing effect.

## Behavior contract

- the latest created character is the active player
- the player moves with WASD or arrow keys inside a larger camera-follow map
- interaction becomes available near another generated character
- pressing `E` triggers visible interaction feedback

## Explicit scope boundary

Still intentionally excludes:

- multiplayer / realtime sync
- combat or complex progression rules
- visual polish / sprite animation push

## Follow-up notes

- movement responsiveness is the most important success bar for this pass
- Phaser currently ships as a large build chunk; if bundle size becomes important, consider chunk-splitting or lazy route isolation
- if richer world simulation appears later, consider extracting the local loop into dedicated world-state logic or scene-specific modules
