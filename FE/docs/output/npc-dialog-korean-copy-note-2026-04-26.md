# NPC Dialog Korean Copy Note

## Summary

Aligned the FE-only NPC add dialog with the current sidebar entry flow and converted the visible dialog copy to Korean-first labels.

## What changed
- the sidebar `Add agent` button continues to open the FE-only NPC dialog
- dialog labels now use Korean copy for title, close button, field labels, and submit states
- tests now assert the Korean dialog content so the button-to-dialog path stays covered

## Scope
- FE-only dialog behavior
- no backend changes
- no dialog layout redesign in this pass
