# Gather-like Layout Note — 2026-04-26

## Summary

Updated the frontend shell so the world viewport sits in the main content area, with the top bar and sidebar living outside the playable region.

## Why

The intended product direction is closer to Gather Town than a generic split-screen dashboard.
That means the room/world should remain the dominant visual surface, while auxiliary UI stays in framing regions.

## What changed

- promoted a dedicated top bar shell
- converted the side panel into a sidebar-oriented placeholder
- expanded the canvas placeholder to a larger world viewport
- aligned the app test with the new layout contract

## Relevant files

- `FE/app/src/App.tsx`
- `FE/app/src/components/InteractionPanel.tsx`
- `FE/app/src/game/WorldCanvas.tsx`
- `FE/app/src/styles/global.css`
- `FE/app/src/App.test.tsx`

## Follow-up

Next UI passes can make the top bar and sidebar more Gather-like, then layer player movement and world overlays into the viewport.

## Visual tone update

The canvas placeholder now leans toward a warm school commons mood with beige walls, wood flooring, window light, desks, and plant accents instead of the earlier cool-toned abstract blocks.

## Additional files

- `FE/app/src/test/setup.ts`

## Product-shell cleanup update

The FE shell was further compacted to feel less like a prototype. Explanatory copy was reduced across the top bar, sidebar, and world-supporting UI, while spacing and section density were tightened without changing feature logic or the world art direction.

## Additional files for shell cleanup

- `FE/app/src/App.tsx`
- `FE/app/src/components/InteractionPanel.tsx`
- `FE/app/src/game/WorldCanvas.tsx`
- `FE/app/src/styles/global.css`
- `FE/app/src/App.test.tsx`
