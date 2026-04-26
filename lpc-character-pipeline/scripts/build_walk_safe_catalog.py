from __future__ import annotations

import argparse
import json
from datetime import date
from pathlib import Path


BODY_TYPES = {"male", "female", "teen", "child", "muscular", "pregnant"}
DEFAULT_GROUP_FILTER = [
    "clothes",
    "jacket",
    "vest",
    "dress",
    "overalls",
    "sleeves",
    "legs",
    "shoes",
    "socks",
    "gloves",
    "head",
    "expression",
    "hair",
    "hat",
    "facial_eyes",
]


def _recolor_palette_signature(item: dict) -> str | None:
    recolors = item.get("recolors")
    if not isinstance(recolors, dict):
        return None
    material = recolors.get("material")
    palettes = recolors.get("palettes")
    if not isinstance(material, str) or not isinstance(palettes, list):
        return None
    palette_refs = [p for p in palettes if isinstance(p, str)]
    if not palette_refs:
        return None
    return f"{material}:{','.join(palette_refs)}"


def _supported_body_types(item: dict) -> list[str]:
    found: set[str] = set()
    for key, value in item.items():
        if not key.startswith("layer_") or not isinstance(value, dict):
            continue
        for body in BODY_TYPES:
            if isinstance(value.get(body), str):
                found.add(body)
    return sorted(found)


def _iter_item_files(sheet_defs_root: Path):
    for path in sorted(sheet_defs_root.rglob("*.json")):
        if path.name.startswith("meta_"):
            continue
        yield path


def _extract_walk_safe_item_ids(
    clone_root: Path,
    *,
    group_filter: set[str] | None = None,
) -> dict[str, set[str]]:
    sheet_defs_root = clone_root / "sheet_definitions"
    if not sheet_defs_root.exists():
        raise FileNotFoundError(f"sheet_definitions not found: {sheet_defs_root}")

    selection_groups: dict[str, set[str]] = {}

    for path in _iter_item_files(sheet_defs_root):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue

        if not isinstance(data, dict):
            continue

        animations = data.get("animations")
        if not isinstance(animations, list) or "walk" not in animations:
            continue

        type_name = data.get("type_name")
        if not isinstance(type_name, str) or not type_name:
            continue
        if group_filter is not None and type_name not in group_filter:
            continue

        body_types = _supported_body_types(data)
        if not body_types:
            continue

        item_id = path.stem
        group = selection_groups.setdefault(type_name, set())
        group.add(item_id)

    return selection_groups


def build_walk_safe_catalog(
    clone_root: Path,
    base_catalog_path: Path,
    *,
    group_filter: set[str] | None = None,
) -> dict:
    safe_items = _extract_walk_safe_item_ids(clone_root, group_filter=group_filter)
    base_catalog = json.loads(base_catalog_path.read_text(encoding="utf-8"))

    filtered_groups: dict[str, dict] = {}
    for group_name, group in (base_catalog.get("selectionGroups") or {}).items():
        if group_filter is not None and group_name not in group_filter:
            continue
        keep_ids = safe_items.get(group_name)
        if not keep_ids:
            continue
        items = (group.get("items") or {})
        next_items = {k: v for k, v in items.items() if k in keep_ids}
        if next_items:
            filtered_groups[group_name] = {"items": dict(sorted(next_items.items()))}

    return {
        "source": base_catalog.get("source", "LPC Universal Spritesheet Character Generator"),
        "repo": base_catalog.get("repo", "https://github.com/liberatedpixelcup/Universal-LPC-Spritesheet-Character-Generator"),
        "extracted_at": str(date.today()),
        "note": "walk-safe subset derived from LPC clone sheet_definitions walk support + base lpc-catalog schema preservation.",
        "bodyTypes": base_catalog.get("bodyTypes", []),
        "skinRecolors": base_catalog.get("skinRecolors", []),
        "palettes": base_catalog.get("palettes", {}),
        "selectionGroups": dict(sorted(filtered_groups.items())),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Build walk-safe catalog from LPC clone sheet_definitions")
    parser.add_argument(
        "--clone-root",
        default="/Users/rs/Git/NeoD/Universal-LPC-Spritesheet-Character-Generator",
        help="Path to local LPC clone root",
    )
    parser.add_argument(
        "--output",
        default="/Users/rs/Git/NeoD/Neo-Developer/lpc-character-pipeline/walk-safe-catalog.json",
        help="Output catalog path",
    )
    parser.add_argument(
        "--base-catalog",
        default="/Users/rs/Git/NeoD/Neo-Developer/lpc-character-pipeline/lpc-catalog.json",
        help="Base lpc-catalog.json to preserve schema/palettes/skinRecolors",
    )
    parser.add_argument(
        "--group-filter",
        default=",".join(DEFAULT_GROUP_FILTER),
        help="Comma-separated selection groups to keep. Use 'all' to disable filtering.",
    )
    args = parser.parse_args()

    if args.group_filter.strip().lower() == "all":
        group_filter = None
    else:
        group_filter = {g.strip() for g in args.group_filter.split(",") if g.strip()}

    catalog = build_walk_safe_catalog(
        Path(args.clone_root),
        Path(args.base_catalog),
        group_filter=group_filter,
    )
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")

    group_count = len(catalog["selectionGroups"])
    item_count = sum(len(g["items"]) for g in catalog["selectionGroups"].values())
    print(json.dumps({"output": str(output_path), "groups": group_count, "items": item_count}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
