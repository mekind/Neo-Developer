# scripts/ — MyClaw character pipeline

End-to-end CLI: `persona.md` → LPC sprite asset bundle.

All paths in this README are relative to the repo root. The module lives at
`lpc-character-pipeline/`.

## Setup

```bash
pip install -r lpc-character-pipeline/requirements.txt
playwright install chromium
export GEMINI_API_KEY=...   # do NOT commit
```

## Usage

```bash
python lpc-character-pipeline/scripts/generate_character.py \
    lpc-character-pipeline/personas/news-bot.md \
    lpc-character-pipeline/output/news-bot
```

Outputs into the given output directory:

- `character.png` — LPC sprite sheet
- `lpc-state.json` — LPC native state (round-trip)
- `CREDITS.txt` — LPC asset attribution (license obligation)
- `mapping-trace.json` — mapper reasoning + color palette check

Flags:
- `--catalog PATH` — override curated catalog (default `lpc-character-pipeline/poc/lpc-catalog-curated.json`)
- `--no-headless` — show the browser (debug)
- `--skip-compose` — mapper only (writes `lpc-state.pre.json`, skips Playwright)

## Pipeline

```
persona.md
    ↓
[mapper.py]   Gemini reads catalog + persona, emits LPC native state JSON
    ↓
[composer.py] Playwright drives the LPC Generator UI: import state, download
              Spritesheet (PNG) + Export to Clipboard (JSON) + Credits (TXT)
    ↓
output/<agent>/{character.png, lpc-state.json, CREDITS.txt, mapping-trace.json}
```

## LLM model

Default `gemini-2.5-flash`. Override via `MYCLAW_MAPPER_MODEL` env var.

## LPC Generator URL

Default https://liberatedpixelcup.github.io/Universal-LPC-Spritesheet-Character-Generator/.
Override via `MYCLAW_LPC_URL` (e.g., self-hosted clone).

## Notes

- Catalog (`lpc-character-pipeline/poc/lpc-catalog-curated.json`, 89 KB / ~22 K tokens) is sent to Gemini in full.
- Mapper output is JSON with `lpc_state`, `trace`, `form_fallback_note`, `color_palette_check`.
- Composer uses clipboard for state import — requires browser permissions, granted automatically by Playwright context.
- See `lpc-character-pipeline/spec.md` for full module spec; `lpc-character-pipeline/poc/` for manual dry-run procedure.
