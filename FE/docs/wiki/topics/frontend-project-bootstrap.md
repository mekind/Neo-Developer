# Frontend Project Bootstrap

## Bootstrap Scope

The first-pass bootstrap covers only:
- FE stack definition
- project creation
- minimal app shell
- minimal 2D world placeholder
- baseline lint/test/format settings

It does **not** include product-complete gather-like systems.

## Project Location

- app root: [`FE/app/`](../../app)

## Chosen layout

```text
FE/
├── app/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── game/
│   │   ├── styles/
│   │   └── types/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── wiki/
└── output/
```

## Baseline conventions

- `src/components/`: React UI shell and layout pieces
- `src/game/`: canvas/world-oriented logic
- `src/styles/`: global styles
- `src/types/`: shared FE types

## Initial scripts

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`
- `npm run test`

## First implementation direction

The initial bootstrap page describes the pre-backend phase only.
The first reusable FE-to-BE slice is documented separately in [[Frontend API Integration Baseline]]([Frontend API Integration Baseline](frontend-api-integration-baseline.md)).


When actual feature work starts, the default shape is:
- React handles shell UI and overlays
- Canvas handles the room/world surface
- world state stays lightweight until real complexity appears

## Current layout direction

The current shell direction is:
- top bar for global status / navigation
- left sidebar for supporting UI such as chat, user list, or room info
- main world viewport occupying the remaining content area

This keeps the world surface visually dominant, closer to a Gather-like product shape, while keeping React-driven UI outside the playable area when possible.

The current placeholder art direction also favors a warm school commons tone so the world feels closer to a friendly campus-like social space than a cold technical demo.

The current shell direction also favors removing placeholder-style copy and tightening layout density so the frontend reads more like an actual product surface than a narrated demo.

## Relevant implementation files

- `FE/app/src/App.tsx`
- `FE/app/src/components/InteractionPanel.tsx`
- `FE/app/src/game/WorldCanvas.tsx`
- `FE/app/src/styles/global.css`
