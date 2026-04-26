# NPC Chat Dialog Shell Note

## Summary

Expanded the frontend NPC chat dialog from a simple shell into a fuller conversation-interface mock.
This pass still stops short of BE wiring, but the dialog now looks and feels like a real in-product chat surface and can be opened from a temporary header trigger for testing.

## What changed

- `FE/app/src/sections/dialog/AgentChatDialogSection.tsx`
  - keeps the standalone NPC chat dialog boundary
  - adds a richer header, NPC summary card, transcript area, prompt chips, message composer, and send button shell
  - preserves a clean prop contract: `agent`, `isOpen`, `onClose`
- `FE/app/src/App.tsx`
  - wires a temporary header-level trigger path for opening the NPC chat dialog against the first loaded agent
- `FE/app/src/sections/title/TitleSection.tsx`
  - adds a topbar test button for opening the chat dialog without waiting for real world interaction wiring
- `FE/app/src/styles/global.css`
  - adds polished chat-dialog styling plus the topbar trigger treatment

## Intent

Reach a design-ready chat interface before coupling the dialog to actual NPC interaction events or backend chat state, while still making the UI easy to test in the browser right now.

## Scope boundary

This pass intentionally does **not** include:

- keyboard-triggered open behavior from proximity interaction
- click-to-open behavior from the Phaser map
- real message sending
- backend chat persistence or dialogue state sync
- branching dialogue logic or conversation history loading

## Follow-up notes

- the temporary header trigger should be removed once a real NPC interaction path opens the dialog
- once backend chat exists, keep transcript rendering and composer behavior inside this component boundary rather than spreading chat layout across `App.tsx`
