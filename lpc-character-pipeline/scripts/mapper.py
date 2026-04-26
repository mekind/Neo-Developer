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
Generator state JSON. Use ONLY the itemIds, variants, and recolors
present in the attached lpc-catalog-curated.json file.

LPC native state schema:
{
  "version": 2,
  "bodyType": "<one of bodyTypes from catalog>",
  "selections": {
    "<selectionGroup>": {
      "itemId": "<filename without .json — must exist in catalog>",
      "variant": "<from catalog item's variants list, or empty string>",
      "recolor": "<color name, mainly for body/head>",
      "name": "<human readable Korean label>"
    }
  },
  "selectedAnimation": "walk"
}

Rules:
- Output VALID JSON only. No commentary outside the JSON.
- Every itemId you output MUST exist in the attached catalog.
- Every variant you output MUST be in that item's "variants" list (if non-empty).
- selections object should include at minimum: body, head, expression, hair,
  hat (or none), facial_eyes (if persona mentions glasses), one torso item
  from {clothes, jacket, vest}, legs, shoes.
- "recolor" applies mainly to body, head (skin tones). For clothing, use "variant".
- If persona is non-human, set form_fallback_note explaining the humanization.
- Pixel Art Prompt resolution hints (e.g., "16x16") are IGNORED. LPC native 64x64.
- selectedAnimation = "walk".
- Glasses live in selectionGroup "facial_eyes" (NOT "accessory").
- If you cannot find a close match, pick a reasonable default and note the gap in trace.

Final output FORMAT (single JSON object, no surrounding code fence):
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
