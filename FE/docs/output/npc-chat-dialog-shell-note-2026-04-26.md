# NPC Chat Dialog Shell Note

## Summary

Added a dedicated frontend chat-dialog shell component for agent NPC conversations.
This pass only creates the reusable dialog surface and styling; it does not yet wire the dialog to an interaction trigger.

## What changed

- `FE/app/src/sections/dialog/AgentChatDialogSection.tsx`
  - introduces a standalone NPC chat dialog component
  - accepts `agent`, `isOpen`, and `onClose` props
  - renders a first-pass transcript-style NPC bubble and close action
- `FE/app/src/styles/global.css`
  - adds chat-dialog layout and bubble styles for the new component

## Intent

Create the UI boundary for future NPC conversation work before coupling it to keyboard or click interaction logic.

## Scope boundary

This pass intentionally does **not** include:

- keyboard-triggered open behavior
- click-to-open behavior from the Phaser map
- message input or branching conversation options
- backend chat persistence or dialogue state sync

## Follow-up notes

- the next step should connect this dialog to a concrete interaction event
- if dialogue grows beyond a single NPC line, keep transcript rendering inside the dialog component rather than pushing chat layout into `App.tsx`
