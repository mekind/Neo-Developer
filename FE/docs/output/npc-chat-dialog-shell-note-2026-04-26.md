# NPC Chat Dialog Shell Note

## Summary

Expanded the frontend NPC chat dialog from a simple shell into a fuller conversation-interface mock.
This pass still stops short of BE wiring or interaction-trigger hookup, but the dialog now looks and feels like a real in-product chat surface.

## What changed

- `FE/app/src/sections/dialog/AgentChatDialogSection.tsx`
  - keeps the standalone NPC chat dialog boundary
  - adds a richer header, NPC summary card, transcript area, prompt chips, message composer, and send button shell
  - preserves a clean prop contract: `agent`, `isOpen`, `onClose`
- `FE/app/src/styles/global.css`
  - adds polished chat-dialog styling for transcript, summary card, prompt chips, composer, and responsive layout

## Intent

Reach a design-ready chat interface before coupling the dialog to actual NPC interaction events or backend chat state.

## Scope boundary

This pass intentionally does **not** include:

- keyboard-triggered open behavior
- click-to-open behavior from the Phaser map
- real message sending
- backend chat persistence or dialogue state sync
- branching dialogue logic or conversation history loading

## Follow-up notes

- the next step should connect this dialog to a concrete interaction event
- once backend chat exists, keep transcript rendering and composer behavior inside this component boundary rather than spreading chat layout across `App.tsx`
