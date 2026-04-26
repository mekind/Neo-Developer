# Frontend Workspace Overview

## Purpose

`FE/` is the repository-local frontend knowledge vault.
It is meant to collect context in a structure that works well for both humans and LLMs: raw inputs stay separate, durable understanding is synthesized into wiki pages, and task-specific outputs are generated into a separate area.

## Structure

### 1. `raw/`
- source documents
- meeting notes
- copied briefs / references
- externally provided requirements

### 2. `wiki/`
- stable topic pages
- cross-linked explanations
- normalized terminology
- durable operating knowledge

### 3. `output/`
- dated plans
- summaries
- review notes
- generated context packs

## Authoring Rules

- Prefer summarizing and cross-linking instead of duplicating source text.
- When a page depends on a source, link the source explicitly.
- Keep one topic per page when possible.
- Update the closest index page whenever a new document is added.
- Use generated outputs for time-bound artifacts, and promote only stable conclusions into topic pages.

## Current Repository Context

At initialization time, the repository has:
- a minimal root `README.md`
- a `docs/hackerthon-infos/` directory with hackathon reference material
- a newly initialized `FE/` vault prepared to become the frontend documentation knowledge base

## Suggested First Documents

1. product / problem statement
2. frontend architecture snapshot
3. screen inventory
4. glossary of feature and domain terms
5. integration map between FE and backend / external services

## Seed Sources

- [[Repo README]] ([Repo README](../../../README.md))
- [[Hackathon Criteria]] ([Hackathon Criteria](../../../docs/hackerthon-infos/CRITERIA.md))
- [[Hackathon Guide PDF]] ([Hackathon Guide PDF](../../../docs/hackerthon-infos/CMUXxAIM-Hackathon-Guide.pdf))
