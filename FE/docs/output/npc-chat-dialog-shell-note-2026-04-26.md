# NPC Chat Dialog Shell Note

## Summary

Expanded the frontend NPC chat dialog from a simple shell into a fuller conversation-interface mock.
This pass still stops short of BE wiring, but the dialog now looks and feels like a real in-product chat surface, supports local transcript-style messaging, and can be opened from a temporary header trigger for testing.

## What changed

- `FE/app/src/sections/dialog/AgentChatDialogSection.tsx`
  - keeps the standalone NPC chat dialog boundary
  - adds a richer header, NPC summary card, transcript area, prompt chips, message composer, and send button shell
  - preserves a clean prop contract: `agent`, `isOpen`, `onClose`
- `FE/app/src/sections/dialog/AgentChatDialogSection.tsx`
  - now supports a larger scrollable transcript area, prompt chips, message composer, Enter-to-send, Shift+Enter line breaks, and local reply simulation
- `FE/app/src/App.tsx`
  - wires a temporary header-level trigger path for opening the NPC chat dialog against the first loaded agent
- `FE/app/src/sections/title/TitleSection.tsx`
  - adds a topbar test button for opening the chat dialog without waiting for real world interaction wiring
- `FE/app/src/App.tsx`
  - falls back to a local mock NPC when no loaded agent is available so the header chat trigger always opens during FE testing
- `FE/app/src/styles/global.css`
  - adds polished chat-dialog styling plus the topbar trigger treatment

- `FE/app/src/game/agents.ts`
  - appends one default dummy NPC (`Noa`) into the FE world roster when backend data does not already provide it

## Intent

Reach a design-ready chat interface before coupling the dialog to actual NPC interaction events or backend chat state, while still making the UI easy to test in the browser right now.

This also keeps one guaranteed NPC in the FE world so the chat surface is easy to test even when backend data is sparse.

## Scope boundary

This pass intentionally does **not** include:

- keyboard-triggered open behavior from proximity interaction
- click-to-open behavior from the Phaser map
- backend-backed message sending
- backend chat persistence or dialogue state sync
- branching dialogue logic or conversation history loading

## Follow-up notes

- the temporary header trigger should be removed once a real NPC interaction path opens the dialog
- the fallback mock NPC should remain test-only and should not replace backend-owned conversation targets long term
- once backend chat exists, keep transcript rendering and composer behavior inside this component boundary rather than spreading chat layout across `App.tsx`
- when backend wiring lands, replace the local simulated reply path without shrinking the current layout or composer affordances
