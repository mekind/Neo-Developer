"""End-to-end CLI: persona.md -> LPC sprite asset bundle.

Usage:
    python scripts/generate_character.py <persona.md> <output_dir> [--catalog PATH]

Outputs into <output_dir>:
    character.png        LPC sprite sheet
    lpc-state.json       LPC native state (round-trip)
    CREDITS.txt          LPC asset attribution
    mapping-trace.json   Mapper reasoning trace + color palette check

Requires:
    GEMINI_API_KEY (or GOOGLE_API_KEY) env var.
    pip install -r requirements.txt
    playwright install chromium
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from mapper import map_persona, enforce_color_restrictions, enforce_torso_coverage
from composer import compose

MODULE_ROOT = Path(__file__).resolve().parent.parent  # lpc-character-pipeline/
DEFAULT_CATALOG = MODULE_ROOT / "walk-safe-catalog.json"


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate LPC character assets from persona.md")
    parser.add_argument("persona", help="Path to persona.md (input)")
    parser.add_argument("output_dir", help="Directory to write generated assets")
    parser.add_argument(
        "--catalog",
        default=str(DEFAULT_CATALOG),
        help=f"Path to LPC catalog JSON (default: {DEFAULT_CATALOG.relative_to(MODULE_ROOT)})",
    )
    parser.add_argument(
        "--no-headless",
        action="store_true",
        help="Run the browser visibly (debugging).",
    )
    parser.add_argument(
        "--skip-compose",
        action="store_true",
        help="Run mapper only; skip Playwright composer.",
    )
    args = parser.parse_args()

    persona_path = Path(args.persona)
    output_dir = Path(args.output_dir)
    catalog_path = Path(args.catalog)

    if not persona_path.exists():
        print(f"persona not found: {persona_path}", file=sys.stderr)
        return 2
    if not catalog_path.exists():
        print(f"catalog not found: {catalog_path}", file=sys.stderr)
        return 2

    persona_text = persona_path.read_text(encoding="utf-8")
    catalog_text = catalog_path.read_text(encoding="utf-8")

    print("[1/2] mapping persona -> LPC state via Gemini...")
    mapping = map_persona(persona_text, catalog_text)

    output_dir.mkdir(parents=True, exist_ok=True)
    trace_path = output_dir / "mapping-trace.json"
    trace_path.write_text(
        json.dumps(
            {
                "form_fallback_note": mapping.get("form_fallback_note"),
                "trace": mapping.get("trace", []),
                "color_palette_check": mapping.get("color_palette_check", {}),
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    state = enforce_torso_coverage(mapping["lpc_state"], catalog_text)
    state = enforce_color_restrictions(state, catalog_text)
    state_path_pre = output_dir / "lpc-state.pre.json"
    state_path_pre.write_text(
        json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"  -> mapper output saved: {state_path_pre.name}, {trace_path.name}")

    if args.skip_compose:
        print("[2/2] skipping composer (--skip-compose).")
        return 0

    print("[2/2] composing sprite via LPC Generator (Playwright)...")
    paths = compose(state, output_dir, headless=not args.no_headless)
    print("  ->", json.dumps(paths, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
