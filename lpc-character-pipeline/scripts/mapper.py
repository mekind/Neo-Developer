"""Map persona.md to LPC native state JSON via Gemini.

Reads:
  - persona.md (text)
  - lpc-catalog-curated.json (LPC item/variant catalog)

Returns:
  dict with keys: lpc_state, form_fallback_note, trace, color_palette_check

Requires:
  - GEMINI_API_KEY env var (or GOOGLE_API_KEY)
  - pip install google-genai
"""

from __future__ import annotations

import json
import os
from pathlib import Path

from google import genai
from google.genai import types

DEFAULT_MODEL = os.environ.get("MYCLAW_MAPPER_MODEL", "gemini-2.5-flash")

SYSTEM_PROMPT = """You are mapping a MyClaw agent persona.md to LPC Universal Spritesheet
Generator state JSON. Use ONLY the itemIds and color values present in the
attached lpc-catalog-curated.json file. DO NOT invent any string.

Catalog shape:
- catalog.bodyTypes: list of allowed bodyType values
- catalog.skinRecolors: list of allowed skin tones for body / head / expression
- catalog.palettes: dict { paletteSig: { material, palette_refs, colors[] } }
- catalog.selectionGroups[group].items[itemId]:
    - variants[]: baked color variants — use as "variant" if present
    - recolorPalette: signature into catalog.palettes — use those colors as "recolor"

LPC native state schema:
{
  "version": 2,
  "bodyType": "<from catalog.bodyTypes>",
  "selections": {
    "<selectionGroup>": {
      "itemId": "<must exist in catalog.selectionGroups[<group>].items>",
      "variant": "<one of items[itemId].variants — only if variants present, else \\\"\\\">",
      "recolor": "<one of catalog.palettes[items[itemId].recolorPalette].colors — only if recolorPalette present, else \\\"\\\">",
      "name": "<short Korean label>"
    }
  },
  "selectedAnimation": "walk"
}

Field choice rules (CRITICAL):
- For each item, look at its catalog entry:
    * variants present  -> set "variant" to one of those values; "recolor" must be "".
    * recolorPalette present -> set "recolor" to one of catalog.palettes[<sig>].colors; "variant" must be "".
    * neither present   -> both "variant" and "recolor" must be "".
- body, head, expression: use "recolor" with a value from catalog.skinRecolors (skin tones).
- DO NOT use a value that is not literally in the catalog. No transliteration, no normalization.
  Example: if persona says "dark brown hair" and palette has "dark_brown", use "dark_brown".
- If a category is not needed (no glasses, no hat, etc.), OMIT that selectionGroup ENTIRELY.
  DO NOT set it to null.

Other rules:
- Output VALID JSON only. No commentary outside the JSON. No surrounding code fence.
- Required selections at minimum: body, head, expression, hair, one of {clothes, jacket, vest}, legs, shoes.
- Optional selections: hat, facial_eyes, accessory, beard, mustache, etc.
- Glasses live in selectionGroup "facial_eyes" (NOT "accessory").
- "Pixel Art Prompt" resolution hints (e.g., "16x16") are IGNORED. LPC is 64x64.
- selectedAnimation = "walk".
- If persona is non-human, pick a humanoid approximation and explain in form_fallback_note.

Final output FORMAT:
{
  "lpc_state": { ... },
  "form_fallback_note": null | "...",
  "trace": [ { "selectionGroup": ..., "itemId": ..., "reason": ... }, ... ],
  "color_palette_check": {
    "persona_palette": [...],
    "applied_lpc_colors": [...],
    "missing_palette_colors": [...]
  }
}
"""


def _resolve_api_key() -> str:
    key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not key:
        raise RuntimeError(
            "GEMINI_API_KEY (or GOOGLE_API_KEY) env var is required. "
            "Do NOT commit the key — set it locally."
        )
    return key


def _strip_fence(raw: str) -> str:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```", 2)[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.rsplit("```", 1)[0]
    return raw.strip()


_TOP_LAYER_KEYS = ("clothes", "jacket", "vest")


def _pick_first(values: list[str], preferred: tuple[str, ...]) -> str:
    for v in preferred:
        if v in values:
            return v
    return values[0]


def _default_clothes_selection(catalog: dict) -> dict | None:
    groups = (catalog.get("selectionGroups") or {})
    clothes_items = ((groups.get("clothes") or {}).get("items") or {})
    if not clothes_items:
        return None

    preferred_ids = (
        "torso_clothes_longsleeve_formal",
        "torso_clothes_blouse_longsleeve",
        "torso_clothes_longsleeve",
    )
    item_id = next((iid for iid in preferred_ids if iid in clothes_items), next(iter(clothes_items)))
    meta = clothes_items[item_id] or {}

    sel = {
        "itemId": item_id,
        "variant": "",
        "recolor": "",
        "name": meta.get("name", "Clothes"),
    }

    variants = meta.get("variants") or []
    if variants:
        sel["variant"] = _pick_first(
            variants,
            ("white", "gray", "charcoal", "black", "brown", "blue", "navy"),
        )
        return sel

    palette_sig = meta.get("recolorPalette")
    if palette_sig:
        colors = (((catalog.get("palettes") or {}).get(palette_sig) or {}).get("colors") or [])
        if colors:
            sel["recolor"] = _pick_first(
                colors,
                ("white", "gray", "charcoal", "black", "brown", "beige", "blue", "navy"),
            )
    return sel


def enforce_torso_coverage(state: dict, catalog_or_json: dict | str) -> dict:
    """Ensure hosted-LPC-safe torso coverage.

    Hosted LPC can drop certain recolor-based clothes during hash round-trip,
    which may leave only apron/jacket overlays and make the character look
    shirtless. We stabilize to a known-safe `clothes` selection when needed.
    """
    catalog = (
        json.loads(catalog_or_json)
        if isinstance(catalog_or_json, str)
        else (catalog_or_json or {})
    )
    groups = (catalog.get("selectionGroups") or {})
    clothes_items = ((groups.get("clothes") or {}).get("items") or {})

    selections = (state.get("selections") or {})
    has_top = any(
        isinstance(selections.get(k), dict) and selections.get(k, {}).get("itemId")
        for k in _TOP_LAYER_KEYS
    )

    needs_stabilize = not has_top
    if not needs_stabilize:
        # If jacket/vest exists, torso is already covered enough for our guard.
        for k in ("jacket", "vest"):
            if isinstance(selections.get(k), dict) and selections.get(k, {}).get("itemId"):
                return state

        clothes_sel = selections.get("clothes")
        if not isinstance(clothes_sel, dict) or not clothes_sel.get("itemId"):
            needs_stabilize = True
        else:
            clothes_meta = clothes_items.get(clothes_sel["itemId"]) or {}
            variants = clothes_meta.get("variants") or []
            if variants:
                chosen = clothes_sel.get("variant")
                # Variant-based tops are generally stable if the chosen variant is valid.
                needs_stabilize = chosen not in variants
            else:
                # Recolor-based tops are prone to hosted hash-loss for some values;
                # force a variant-based safe fallback.
                needs_stabilize = bool(clothes_meta.get("recolorPalette"))

    if not needs_stabilize:
        return state

    default_top = _default_clothes_selection(catalog)
    if not default_top:
        return state

    next_selections = dict(selections)
    next_selections["clothes"] = default_top
    return {**state, "selections": next_selections}


def map_persona(persona_md: str, catalog_json: str, *, model: str = DEFAULT_MODEL) -> dict:
    """Call Gemini with persona + catalog. Return parsed mapping result."""
    client = genai.Client(api_key=_resolve_api_key())

    user_text = (
        "Here is the LPC catalog (use ONLY these itemIds and variants):\n\n"
        "<catalog>\n"
        f"{catalog_json}\n"
        "</catalog>\n\n"
        "Here is the persona.md to map:\n\n"
        "<persona>\n"
        f"{persona_md}\n"
        "</persona>\n\n"
        "Output the JSON now."
    )

    response = client.models.generate_content(
        model=model,
        contents=user_text,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json",
            temperature=0.2,
        ),
    )

    raw = _strip_fence(response.text or "")
    return json.loads(raw)


if __name__ == "__main__":
    import sys

    if len(sys.argv) != 3:
        print("usage: python mapper.py <persona.md> <lpc-catalog-curated.json>")
        sys.exit(2)

    persona = Path(sys.argv[1]).read_text(encoding="utf-8")
    catalog = Path(sys.argv[2]).read_text(encoding="utf-8")
    result = map_persona(persona, catalog)
    print(json.dumps(result, ensure_ascii=False, indent=2))
