# Dialog Close Button Polish Note

## Summary

Refined the FE-only NPC add dialog close control from a plain text button into a more readable pill-style close action with an icon and stronger visual affordance.

## What changed
- `FE/app/src/sections/dialog/AddAgentDialogSection.tsx`
  - close control now shows an icon plus label
  - keeps the same close behavior and disabled state
- `FE/app/src/styles/global.css`
  - adds a dedicated `dialog-close-button` visual style for the add-agent dialog header

## Scope
- FE-only visual polish
- no behavior change beyond clearer affordance
- no backend changes
