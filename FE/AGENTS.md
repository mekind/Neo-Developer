# FE Documentation Vault Guidance

This directory contains an llm-wiki-style documentation vault for frontend context under `FE/docs/`.

## Purpose
- Keep frontend knowledge in markdown that both humans and LLMs can navigate.
- Separate raw source material, synthesized wiki articles, and generated outputs.

## Structure
- `docs/raw/` — source notes and imported materials; treat as append-only / immutable.
- `docs/wiki/` — synthesized topic pages and reference indexes.
- `docs/output/` — generated briefs, plans, summaries, and decision artifacts.
- `docs/log.md` — chronological documentation activity log.
- `docs/config.md` — vault rules and conventions.

## Rules
- Prefer synthesis over copy-paste.
- Preserve source links whenever facts come from another document.
- Use dual links when useful: `[[Page Title]]` plus standard markdown links.
- Keep indexes current when adding new pages.
- Put durable operating knowledge in `docs/wiki/topics/`.
- Put inventories, glossaries, and lookup tables in `docs/wiki/references/`.
- Put time-stamped generated artifacts in `docs/output/`.
