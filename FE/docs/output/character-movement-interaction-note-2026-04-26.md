# Character Movement Interaction Note

## Summary

Extended the FE world prototype from spawn-only avatars to a first playable loop:
create a character, move the latest-created avatar, then interact with nearby generated characters.

## What changed

- `FE/app/src/App.tsx`
  - keeps the latest created character as the controllable player
  - adds keyboard movement and interaction state
- `FE/app/src/game/characters.ts`
  - centralizes world sizing, movement, interaction, and character creation helpers
- `FE/app/src/game/WorldCanvas.tsx`
  - shows player status, nearby interaction prompts, and last interaction feedback
  - highlights the active player and nearby interaction target
- `FE/app/src/App.test.tsx`
  - preserves spawn/append behavior tests
  - adds movement + interaction loop coverage

## Intent

The prototype should now feel like a tiny Gather-style playable slice rather than a static character placement demo.

## Behavior contract

- the latest created character is the active player
- the player moves with WASD or arrow keys
- interaction becomes available near another generated character
- pressing `E` triggers visible interaction feedback

## Explicit scope boundary

Still intentionally excludes:

- multiplayer / realtime sync
- combat or complex progression rules
- visual polish / sprite animation push

## Follow-up notes

- movement responsiveness is the most important success bar for this pass
- if richer world simulation appears later, consider extracting the local loop into dedicated world-state logic
