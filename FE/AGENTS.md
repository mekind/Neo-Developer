# FE Documentation Vault Guidance

This directory is an llm-wiki-style documentation vault for frontend context.

## Purpose
- Keep frontend knowledge in markdown that both humans and LLMs can navigate.
- Separate raw source material, synthesized wiki articles, and generated outputs.

## Structure
- `raw/` — source notes and imported materials; treat as append-only / immutable.
- `wiki/` — synthesized topic pages and reference indexes.
- `output/` — generated briefs, plans, summaries, and decision artifacts.
- `log.md` — chronological documentation activity log.
- `config.md` — vault rules and conventions.

## Rules
- Prefer synthesis over copy-paste.
- Preserve source links whenever facts come from another document.
- Use dual links when useful: `[[Page Title]]` plus standard markdown links.
- Keep indexes current when adding new pages.
- Put durable operating knowledge in `wiki/topics/`.
- Put inventories, glossaries, and lookup tables in `wiki/references/`.
- Put time-stamped generated artifacts in `output/`.
