# LPC-Catalog Dependency Map: End-to-End Analysis

**Generated**: 2026-04-26  
**Repo**: `/Users/rs/Git/NeoD/Neo-Developer`  
**Module**: `lpc-character-pipeline`

---

## 1. CATALOG PRODUCTION

### 1.1 Source Files

| File | Size | Purpose | Status |
|------|------|---------|--------|
| `lpc-character-pipeline/lpc-catalog.json` | 10,570 lines | Full LPC catalog (655 items) | ✅ Committed |
| `lpc-character-pipeline/poc/lpc-catalog-curated.json` | 4,687 lines | Curated subset (human/office personas) | ✅ Committed |

### 1.2 Catalog Generation

**Current Status**: Manually extracted & committed (no generation script exists)

**Source**: LPC Universal Spritesheet Character Generator  
- Repo: https://github.com/liberatedpixelcup/Universal-LPC-Spritesheet-Character-Generator
- Extracted from: `sheet_definitions/**/*.json` (LPC repo)
- Extraction date: 2026-04-26 (hardcoded in both JSON files)

**How it was created**:
- Commit: `fa453f67289fd318ea8044a00bc4b25eb891e5e1` ("Co-locate the LPC character pipeline under one module dir")
- Method: Manual extraction (no script documented)
- Note: Spec mentions "1회 추출 스크립트로 생성 (구현 1일차)" but no script exists in repo

### 1.3 Catalog Schema

Both catalogs follow identical structure:

```json
{
  "source": "LPC Universal Spritesheet Character Generator",
  "repo": "https://github.com/liberatedpixelcup/Universal-LPC-Spritesheet-Character-Generator",
  "extracted_at": "2026-04-26",
  "bodyTypes": ["male", "female", "teen", "child", "muscular", "pregnant"],
  "skinRecolors": [
    "amber", "black", "blue", "bright_green", "bronze", "brown", "coffee",
    "dark_green", "fur_black", "fur_brown", "fur_copper", "fur_gold",
    "fur_grey", "fur_tan", "fur_white", "green", "honey", "ivory",
    "lavender", "light", "olive", "pale_green", "peach", "porcelain",
    "tan", "taupe", "tawny", "zombie", "zombie_green"
  ],
  "palettes": {
    "<paletteSig>": {
      "material": "<string>",
      "palette_refs": ["<ref>", ...],
      "colors": ["<color>", ...]
    }
  },
  "selectionGroups": {
    "<groupName>": {
      "items": {
        "<itemId>": {
          "name": "<human label>",
          "variants": ["<variant>", ...],
          "recolorPalette": "<paletteSig>"
        }
      }
    }
  }
}
```

### 1.4 Curated Subset Differences

**Full catalog** (`lpc-catalog.json`):
- 655 items across all categories
- Includes fantasy/non-human options (wings, horns, etc.)
- All palette variants

**Curated subset** (`lpc-catalog-curated.json`):
- ~105 KB (vs ~300 KB full)
- Human/office personas only
- Filtered for professional/realistic appearance
- Same schema, fewer items in `selectionGroups`

---

## 2. MAPPER CONSUMPTION

### 2.1 Entry Point

**File**: `/Users/rs/Git/NeoD/Neo-Developer/lpc-character-pipeline/scripts/mapper.py`

**Function**: `map_persona(persona_md: str, catalog_json: str, *, model: str = DEFAULT_MODEL) -> dict`

**CLI Usage**:
```bash
python mapper.py <persona.md> <lpc-catalog-curated.json>
```

### 2.2 Mapper Inputs

| Input | Type | Source | Required |
|-------|------|--------|----------|
| `persona_md` | str | File content (persona.md) | ✅ Yes |
| `catalog_json` | str | File content (lpc-catalog-curated.json) | ✅ Yes |
| `GEMINI_API_KEY` env var | str | Environment | ✅ Yes |
| `MYCLAW_MAPPER_MODEL` env var | str | Environment (default: `gemini-2.5-flash`) | ❌ Optional |

### 2.3 Mapper Processing

**LLM Call**:
- Model: `gemini-2.5-flash` (configurable via `MYCLAW_MAPPER_MODEL`)
- Temperature: 0.2 (low randomness)
- Response format: JSON (enforced via `response_mime_type="application/json"`)

**System Prompt** (lines 26-84):
- Instructs Gemini to use ONLY itemIds/colors from catalog
- Defines LPC native state schema
- Specifies field choice rules (variants vs recolor)
- Requires minimum selections: body, head, expression, hair, clothes/jacket/vest, legs, shoes

**Catalog Usage**:
- Reads `catalog.bodyTypes` for valid body types
- Reads `catalog.skinRecolors` for skin tone options
- Reads `catalog.palettes[<sig>].colors` for recolor values
- Reads `catalog.selectionGroups[<group>].items[<itemId>]` for item existence & variants

### 2.4 Mapper Outputs

```python
{
  "lpc_state": {
    "version": 2,
    "bodyType": "<from catalog.bodyTypes>",
    "selections": {
      "<selectionGroup>": {
        "itemId": "<must exist in catalog>",
        "variant": "<one of items[itemId].variants or ''>",
        "recolor": "<one of catalog.palettes[...].colors or ''>",
        "name": "<Korean label>"
      }
    },
    "selectedAnimation": "walk"
  },
  "form_fallback_note": null | "<explanation if non-human>",
  "trace": [
    { "selectionGroup": "...", "itemId": "...", "reason": "..." },
    ...
  ],
  "color_palette_check": {
    "persona_palette": [...],
    "applied_lpc_colors": [...],
    "missing_palette_colors": [...]
  }
}
```

---

## 3. COMPOSER CONSUMPTION

### 3.1 Entry Point

**File**: `/Users/rs/Git/NeoD/Neo-Developer/lpc-character-pipeline/scripts/composer.py`

**Class**: `Composer(headless: bool = True)`

**CLI Usage**:
```bash
python composer.py <lpc-state.json> <output_dir>
```

**Programmatic Usage**:
```python
with Composer() as c:
    c.compose(state_dict, Path(output_dir))
```

### 3.2 Composer Inputs

| Input | Type | Source | Required |
|-------|------|--------|----------|
| `state` | dict | Mapper output (`lpc_state` key) | ✅ Yes |
| `output_dir` | Path | CLI arg or function param | ✅ Yes |
| `MYCLAW_LPC_URL` env var | str | Environment (default: hosted URL) | ❌ Optional |
| Browser (Playwright) | - | Chromium launch | ✅ Yes |

### 3.3 Composer Processing

**Browser Automation**:
1. Launch Chromium (headless or visible)
2. Navigate to LPC Generator URL (default: https://liberatedpixelcup.github.io/Universal-LPC-Spritesheet-Character-Generator/)
3. Wait for page load + catalog assets ready
4. Inject state JSON via clipboard
5. Click "Import from Clipboard (JSON)"
6. Call `window.canvasRenderer.renderCharacter(selections, bodyType)` and await
7. Download 3 files:
   - "Spritesheet (PNG)" → `character.png`
   - "Credits (TXT)" → `CREDITS.txt`
   - Export to Clipboard (JSON) → `lpc-state.json`
8. Generate `frame-map.json` (hardcoded LPC standard layout)

**State Sanitization** (lines 91-127):
- Removes null/None selections
- Ensures body/head/expression present with valid skin tone
- Normalizes hosted-safe skin recolors (fallback mapping for unsupported colors)
- Forces body/head/expression skin tones to match

**Hosted Safe Skin Recolors** (lines 50-83):
- Supported: light, amber, olive, taupe, bronze, brown, black, blue, bright_green, dark_green, fur_*, green, lavender, pale_green, zombie, zombie_green
- Fallback mapping: ivory→light, porcelain→light, peach→light, tan→taupe, tawny→bronze, honey→amber, coffee→brown

### 3.4 Composer Outputs

| File | Type | Purpose |
|------|------|---------|
| `character.png` | PNG (832×3456) | LPC sprite sheet (8 directions × 8 walk frames + 8 idle frames) |
| `lpc-state.json` | JSON | Round-trip state (Export to Clipboard) |
| `CREDITS.txt` | TXT | LPC asset attribution (license obligation) |
| `frame-map.json` | JSON | Animation frame metadata (hardcoded) |

**frame-map.json Structure**:
```json
{
  "sheet": "character.png",
  "frameSize": 64,
  "note": "LPC standard layout...",
  "animations": {
    "walk_n": { "y": 512, "frames": [1,2,3,4,5,6,7,8], "fps": 8 },
    "walk_w": { "y": 576, "frames": [1,2,3,4,5,6,7,8], "fps": 8 },
    "walk_s": { "y": 640, "frames": [1,2,3,4,5,6,7,8], "fps": 8 },
    "walk_e": { "y": 704, "frames": [1,2,3,4,5,6,7,8], "fps": 8 },
    "idle_n": { "y": 1408, "frames": [0,0,1], "fps": 4 },
    "idle_w": { "y": 1472, "frames": [0,0,1], "fps": 4 },
    "idle_s": { "y": 1536, "frames": [0,0,1], "fps": 4 },
    "idle_e": { "y": 1600, "frames": [0,0,1], "fps": 4 }
  }
}
```

---

## 4. FULL PIPELINE ORCHESTRATION

### 4.1 CLI Entry Point

**File**: `/Users/rs/Git/NeoD/Neo-Developer/lpc-character-pipeline/scripts/generate_character.py`

**Command**:
```bash
python lpc-character-pipeline/scripts/generate_character.py \
    <persona.md> \
    <output_dir> \
    [--catalog PATH] \
    [--no-headless] \
    [--skip-compose]
```

**Default Catalog**: `lpc-character-pipeline/poc/lpc-catalog-curated.json`

### 4.2 Pipeline Flow

```
persona.md
    ↓
[1] mapper.py
    - Input: persona.md + lpc-catalog-curated.json
    - Output: lpc-state.pre.json + mapping-trace.json
    ↓
[2] composer.py (unless --skip-compose)
    - Input: lpc-state.pre.json
    - Output: character.png + lpc-state.json + CREDITS.txt + frame-map.json
    ↓
output_dir/
    ├── character.png
    ├── lpc-state.json
    ├── CREDITS.txt
    ├── frame-map.json
    ├── lpc-state.pre.json (mapper intermediate)
    └── mapping-trace.json (mapper reasoning)
```

### 4.3 FastAPI Sidecar

**File**: `/Users/rs/Git/NeoD/Neo-Developer/lpc-character-pipeline/scripts/api.py`

**Purpose**: HTTP wrapper for backend integration

**Endpoints**:
- `GET /healthz` — readiness check
- `POST /generate-character` — full pipeline (persona.md → assets)

**Request Schema**:
```python
{
  "persona_md": str,
  "agent_id": str | None
}
```

**Response Schema**:
```python
{
  "character_png_b64": str,  # base64-encoded PNG
  "lpc_state": dict,         # LPC native state
  "frame_map": dict,         # Animation metadata
  "credits": str,            # Attribution text
  "mapping_trace": dict      # Mapper reasoning
}
```

**Startup**:
```bash
uvicorn lpc-character-pipeline.scripts.api:app \
    --host 0.0.0.0 --port 8001 --workers 1
```

---

## 5. ASSUMPTIONS & CONSTRAINTS

### 5.1 Catalog Assumptions

1. **Static extraction**: Catalog is manually extracted from LPC repo, not auto-generated
2. **No versioning**: Single `extracted_at` timestamp; no version tracking
3. **Curated subset**: Human/office personas only; fantasy items excluded
4. **Palette resolution**: `recolorPalette` field maps to `palettes[<sig>].colors`
5. **Variant exclusivity**: Item has EITHER `variants[]` OR `recolorPalette`, not both

### 5.2 Mapper Assumptions

1. **Catalog completeness**: All itemIds in catalog are valid for LPC Generator
2. **Gemini accuracy**: LLM correctly interprets persona.md and maps to catalog
3. **No invention**: Mapper must use ONLY catalog values; no custom strings
4. **Skin tone consistency**: body/head/expression must use same recolor
5. **Minimum selections**: body, head, expression, hair, clothes/jacket/vest, legs, shoes required

### 5.3 Composer Assumptions

1. **Hosted LPC availability**: Public URL always accessible
2. **Browser permissions**: Clipboard read/write granted automatically
3. **State round-trip**: Export to Clipboard JSON matches Import input (with caveats)
4. **Hosted safe colors**: Only specific skin recolors work reliably on hosted LPC
5. **Animation layout**: LPC standard 64×64 frame size, fixed y-offsets for walk/idle

### 5.4 Known Issues

1. **Body layer round-trip**: body/head/expression selections disappear after import+export
   - Symptom: `lpc-state.json` missing body/head/expression keys
   - Hypothesis: LPC's `applyMatchBodyColor` or state stripping
   - Workaround: Use mapper's `lpc-state.pre.json` as fallback

2. **Hosted skin recolor limitations**: Some colors (peach, ivory, etc.) not supported
   - Fallback mapping applied in `_normalize_hosted_skin_recolor()`

3. **Non-human personas**: Mapper outputs fallback note; no automatic humanoid approximation

---

## 6. FILE LOCATIONS (EXACT PATHS)

### Catalogs
- Full: `/Users/rs/Git/NeoD/Neo-Developer/lpc-character-pipeline/lpc-catalog.json`
- Curated: `/Users/rs/Git/NeoD/Neo-Developer/lpc-character-pipeline/poc/lpc-catalog-curated.json`

### Scripts
- Mapper: `/Users/rs/Git/NeoD/Neo-Developer/lpc-character-pipeline/scripts/mapper.py`
- Composer: `/Users/rs/Git/NeoD/Neo-Developer/lpc-character-pipeline/scripts/composer.py`
- CLI: `/Users/rs/Git/NeoD/Neo-Developer/lpc-character-pipeline/scripts/generate_character.py`
- API: `/Users/rs/Git/NeoD/Neo-Developer/lpc-character-pipeline/scripts/api.py`

### Examples
- Carrot-man: `/Users/rs/Git/NeoD/Neo-Developer/lpc-character-pipeline/.example/carrot-man/`
- News-bot: `/Users/rs/Git/NeoD/Neo-Developer/lpc-character-pipeline/.example/news-bot/`

### Documentation
- Module README: `/Users/rs/Git/NeoD/Neo-Developer/lpc-character-pipeline/README.md`
- Spec: `/Users/rs/Git/NeoD/Neo-Developer/lpc-character-pipeline/spec.md`
- PoC README: `/Users/rs/Git/NeoD/Neo-Developer/lpc-character-pipeline/poc/README.md`
- Handoff: `/Users/rs/Git/NeoD/Neo-Developer/lpc-character-pipeline/HANDOFF.md`
- Scripts README: `/Users/rs/Git/NeoD/Neo-Developer/lpc-character-pipeline/scripts/README.md`

---

## 7. COMMAND ENTRY POINTS

### Mapper (standalone)
```bash
python /Users/rs/Git/NeoD/Neo-Developer/lpc-character-pipeline/scripts/mapper.py \
    <persona.md> \
    <lpc-catalog-curated.json>
```

### Composer (standalone)
```bash
python /Users/rs/Git/NeoD/Neo-Developer/lpc-character-pipeline/scripts/composer.py \
    <lpc-state.json> \
    <output_dir>
```

### Full Pipeline (CLI)
```bash
python /Users/rs/Git/NeoD/Neo-Developer/lpc-character-pipeline/scripts/generate_character.py \
    /Users/rs/Git/NeoD/Neo-Developer/lpc-character-pipeline/personas/news-bot.md \
    /Users/rs/Git/NeoD/Neo-Developer/lpc-character-pipeline/.example/news-bot \
    --catalog /Users/rs/Git/NeoD/Neo-Developer/lpc-character-pipeline/poc/lpc-catalog-curated.json
```

### FastAPI Sidecar
```bash
uvicorn lpc-character-pipeline.scripts.api:app \
    --host 0.0.0.0 --port 8001 --workers 1
```

### Environment Variables
```bash
export GEMINI_API_KEY=<key>                    # Required for mapper
export MYCLAW_MAPPER_MODEL=gemini-2.5-flash   # Optional (default shown)
export MYCLAW_LPC_URL=<url>                    # Optional (default: hosted)
```

---

## 8. DEPENDENCY SUMMARY TABLE

| Component | Input | Catalog Used | Output | Status |
|-----------|-------|--------------|--------|--------|
| **Mapper** | persona.md | lpc-catalog-curated.json | lpc-state.pre.json + mapping-trace.json | ✅ Working |
| **Composer** | lpc-state.pre.json | (none) | character.png + lpc-state.json + CREDITS.txt + frame-map.json | ✅ Working (body layer issue) |
| **CLI** | persona.md | lpc-catalog-curated.json | Full output dir | ✅ Working |
| **API** | persona.md (HTTP) | lpc-catalog-curated.json | JSON response (base64 PNG + metadata) | ✅ Implemented, untested |

---

**End of Dependency Map**
