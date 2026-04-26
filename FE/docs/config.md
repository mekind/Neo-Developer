# Vault Config

- type: local llm wiki vault
- scope: `FE/docs/`
- purpose: persistent markdown knowledge base for demo-oriented frontend context in `Neo-Developer`
- product stage: demo / prototype only; document choices with demo scope in mind
- source policy: raw sources remain intact; annotate rather than rewrite
- article policy: wiki pages synthesize, normalize, and cross-link facts from sources
- output policy: generated plans, briefs, and snapshots live under `output/`
- linking policy: prefer dual links when useful for both Obsidian-style and plain markdown readers
- naming policy: durable topics use stable names; generated outputs should be date-stamped
- update policy: when new docs are added, update the nearest `_index.md` and `log.md`
