"""Compose LPC sprite assets from an LPC native state JSON via Playwright.

Uses the public LPC Generator UI:
  https://liberatedpixelcup.github.io/Universal-LPC-Spritesheet-Character-Generator/

Outputs (into output_dir):
  - character.png    Spritesheet
  - lpc-state.json   Round-trip Export to Clipboard JSON
  - CREDITS.txt      LPC asset attribution

Usage patterns:
  # One-shot CLI
  python composer.py <state.json> <output_dir>

  # Programmatic, with a warm browser reused across multiple compose() calls
  with Composer() as c:
      c.compose(state_a, out_a)
      c.compose(state_b, out_b)   # ~5s (no relaunch / page reload)

Requires:
  - pip install playwright
  - playwright install chromium
"""

from __future__ import annotations

import hashlib
import json
import os
import shutil
import sys
from pathlib import Path
from typing import Any, Optional

from playwright.sync_api import (
    sync_playwright,
    Page,
    BrowserContext,
    Browser,
    Playwright,
)

LPC_URL = os.environ.get(
    "MYCLAW_LPC_URL",
    "https://liberatedpixelcup.github.io/Universal-LPC-Spritesheet-Character-Generator/",
)

# Debug instrumentation flag for tracking selection disappearance
_DEBUG_LPC = os.environ.get("MYCLAW_LPC_DEBUG", "").lower() in ("1", "true", "yes")

# Hosted LPC currently hash-round-trips only the first skin palette for body-like
# selections. Colors from later palettes (e.g. lpcr `peach`) get dropped during
# the app's own hash hydration, which removes body/head/expression from state and
# makes skin layers disappear in the exported PNG.
_HOSTED_SAFE_SKIN_RECOLORS = {
    "light",
    "amber",
    "olive",
    "taupe",
    "bronze",
    "brown",
    "black",
    "blue",
    "bright_green",
    "dark_green",
    "fur_black",
    "fur_brown",
    "fur_copper",
    "fur_gold",
    "fur_grey",
    "fur_tan",
    "fur_white",
    "green",
    "lavender",
    "pale_green",
    "zombie",
    "zombie_green",
}

_HOSTED_SKIN_RECOLOR_FALLBACKS = {
    "ivory": "light",
    "porcelain": "light",
    "peach": "light",
    "tan": "taupe",
    "tawny": "bronze",
    "honey": "amber",
    "coffee": "brown",
}


# --------------------------------------------------------------------------- #
# Internal page operations                                                    #
# --------------------------------------------------------------------------- #


def _sanitize_state(state: dict) -> dict:
    """Drop null/None selection entries so the renderer doesn't choke on them.

    Also guarantees body/head/expression are present with a sensible skin tone
    so hands and face are not missing from the rendered sprite.
    """
    sel = state.get("selections", {}) or {}
    cleaned = {k: v for k, v in sel.items() if v is not None and isinstance(v, dict) and v.get("itemId")}

    body_recolor = _normalize_hosted_skin_recolor((cleaned.get("body") or {}).get("recolor") or "light")

    cleaned.setdefault(
        "body",
        {"itemId": "body", "variant": "", "recolor": body_recolor, "name": "Body"},
    )
    body_type = state.get("bodyType", "male")
    head_default_id = "heads_human_female" if body_type == "female" else "heads_human_male"
    cleaned.setdefault(
        "head",
        {"itemId": head_default_id, "variant": "", "recolor": body_recolor, "name": "Head"},
    )
    cleaned.setdefault(
        "expression",
        {"itemId": "face_neutral", "variant": "", "recolor": body_recolor, "name": "Neutral"},
    )

    # Force body/head/expression skin tones to match each other.
    for key in ("body", "head", "expression"):
        cleaned[key]["recolor"] = body_recolor

    return {**state, "selections": cleaned}


def _normalize_hosted_skin_recolor(recolor: str) -> str:
    if recolor in _HOSTED_SAFE_SKIN_RECOLORS:
        return recolor
    return _HOSTED_SKIN_RECOLOR_FALLBACKS.get(recolor, "light")


def _debug_checkpoint(label: str, state: dict) -> None:
    """Log selection keys and hash at a checkpoint if debug flag is enabled.
    
    Fail-safe: never raises, only logs to stderr if _DEBUG_LPC is True.
    """
    if not _DEBUG_LPC:
        return
    try:
        sel = state.get("selections", {}) or {}
        keys = sorted(sel.keys())
        state_json = json.dumps(state, sort_keys=True, separators=(",", ":"))
        state_hash = hashlib.sha256(state_json.encode()).hexdigest()[:16]
        print(f"[LPC_DEBUG] {label}: keys={keys}, hash={state_hash}", file=sys.stderr)
    except Exception:
        pass


def _import_state(page: Page, state: dict) -> None:
    """Inject state JSON via clipboard, click Import, then force a synchronous
    re-render so we can await its completion (per-item layer fetches included).

    The LPC app's `state` isn't on window so we can't poll its render flags.
    Instead we call `window.canvasRenderer.renderCharacter(selections, bodyType)`
    ourselves with the same selections we just imported and await its promise.
    The renderer queues subsequent calls behind in-flight ones, so this also
    waits for the in-flight render kicked off by Import.
    """
    clean = _sanitize_state(state)
    state_json = json.dumps(clean)
    page.evaluate("text => navigator.clipboard.writeText(text)", state_json)
    page.once("dialog", lambda d: d.accept())
    page.get_by_role("button", name="Import from Clipboard (JSON)").click()
    _debug_checkpoint("after_import_click", clean)

    page.evaluate(
        """async ({ selections, bodyType }) => {
            const r = window.canvasRenderer;
            if (!r || typeof r.renderCharacter !== 'function') {
                throw new Error('canvasRenderer.renderCharacter unavailable');
            }
            await r.renderCharacter(selections, bodyType);
        }""",
        {"selections": clean["selections"], "bodyType": clean.get("bodyType", "male")},
    )
    _debug_checkpoint("after_render_await", clean)
    # Belt-and-suspenders: small settle window for any final image decodes.
    page.wait_for_timeout(500)


def _click_download(page: Page, button_label: str, expected_filename: str, dest: Path) -> Path:
    with page.expect_download() as info:
        page.get_by_role("button", name=button_label).click()
    download = info.value
    target = dest / expected_filename
    download.save_as(str(target))
    return target


def _read_export_clipboard(page: Page) -> str:
    page.get_by_role("button", name="Export to Clipboard (JSON)").click()
    page.wait_for_timeout(300)
    page.once("dialog", lambda d: d.accept())
    text = page.evaluate("() => navigator.clipboard.readText()")
    return text or ""


def _open_page(playwright: Playwright, headless: bool) -> tuple[Browser, BrowserContext, Page]:
    browser = playwright.chromium.launch(headless=headless)
    context = browser.new_context(permissions=["clipboard-read", "clipboard-write"])
    page = context.new_page()
    page.set_default_timeout(60_000)
    page.goto(LPC_URL, wait_until="networkidle")
    import_btn = page.get_by_role("button", name="Import from Clipboard (JSON)")
    try:
        import_btn.wait_for(state="visible", timeout=15_000)
    except Exception:
        # Try clicking the Download collapsible header to expand it.
        for opener in (
            lambda: page.get_by_role("heading", name="Download").click(timeout=3_000),
            lambda: page.locator("button, h2, h3, summary", has_text="Download").first.click(timeout=3_000),
            lambda: page.get_by_text("Download", exact=False).first.click(timeout=3_000),
        ):
            try:
                opener()
                break
            except Exception:
                continue
        import_btn.wait_for(state="visible", timeout=20_000)
    # The ZIP buttons stay `disabled` until isLayersReady() flips true. Use that
    # as a proxy signal that the catalog + layer assets have finished loading.
    page.wait_for_function(
        """() => {
            const btn = [...document.querySelectorAll('button')]
                .find(b => /ZIP: Split by animation/.test(b.textContent || ''));
            return btn && !btn.disabled;
        }""",
        timeout=60_000,
    )
    return browser, context, page


FRAME_MAP = {
    "sheet": "character.png",
    "frameSize": 64,
    "note": "LPC standard layout. Same for every character generated by this pipeline. y/frames derived from sources/state/constants.ts (ANIMATION_OFFSETS + ANIMATION_CONFIGS).",
    "animations": {
        "walk_n": {"y": 512, "frames": [1, 2, 3, 4, 5, 6, 7, 8], "fps": 8},
        "walk_w": {"y": 576, "frames": [1, 2, 3, 4, 5, 6, 7, 8], "fps": 8},
        "walk_s": {"y": 640, "frames": [1, 2, 3, 4, 5, 6, 7, 8], "fps": 8},
        "walk_e": {"y": 704, "frames": [1, 2, 3, 4, 5, 6, 7, 8], "fps": 8},
        "idle_n": {"y": 1408, "frames": [0, 0, 1], "fps": 4},
        "idle_w": {"y": 1472, "frames": [0, 0, 1], "fps": 4},
        "idle_s": {"y": 1536, "frames": [0, 0, 1], "fps": 4},
        "idle_e": {"y": 1600, "frames": [0, 0, 1], "fps": 4},
    },
}


def _save_outputs(page: Page, output_dir: Path, state: dict) -> dict:
    output_dir.mkdir(parents=True, exist_ok=True)

    png_tmp = _click_download(page, "Spritesheet (PNG)", "character-spritesheet.png", output_dir)
    char_png = output_dir / "character.png"
    if png_tmp != char_png:
        shutil.move(str(png_tmp), str(char_png))

    credits_tmp = _click_download(page, "Credits (TXT)", "credits.txt", output_dir)
    credits_path = output_dir / "CREDITS.txt"
    if credits_tmp != credits_path:
        shutil.move(str(credits_tmp), str(credits_path))

    state_text = _read_export_clipboard(page)
    state_path = output_dir / "lpc-state.json"
    if state_text:
        state_path.write_text(state_text, encoding="utf-8")
    else:
        state_path.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")

    frame_map_path = output_dir / "frame-map.json"
    frame_map_path.write_text(
        json.dumps(FRAME_MAP, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    return {
        "character_png": str(char_png),
        "lpc_state": str(state_path),
        "credits": str(credits_path),
        "frame_map": str(frame_map_path),
    }


# --------------------------------------------------------------------------- #
# Public API                                                                  #
# --------------------------------------------------------------------------- #


class Composer:
    """Reusable LPC composer with a warm browser/page.

    First compose() pays the page-load cost (~10-15s); subsequent calls reuse
    the same page and only pay for state import + render + downloads (~5s).
    """

    def __init__(self, headless: bool = True) -> None:
        self.headless = headless
        self._pw: Optional[Playwright] = None
        self._browser: Optional[Browser] = None
        self._context: Optional[BrowserContext] = None
        self._page: Optional[Page] = None

    def __enter__(self) -> "Composer":
        self._pw = sync_playwright().start()
        self._browser, self._context, self._page = _open_page(self._pw, self.headless)
        return self

    def __exit__(self, exc_type: Any, exc: Any, tb: Any) -> None:
        self.close()

    def compose(self, state: dict, output_dir: Path) -> dict:
        if self._page is None:
            raise RuntimeError("Composer must be used as a context manager (with-block).")
        _import_state(self._page, state)
        return _save_outputs(self._page, Path(output_dir), state)

    def close(self) -> None:
        try:
            if self._context:
                self._context.close()
            if self._browser:
                self._browser.close()
        finally:
            if self._pw:
                self._pw.stop()
            self._pw = None
            self._browser = None
            self._context = None
            self._page = None


def compose(state: dict, output_dir: Path, *, headless: bool = True) -> dict:
    """One-shot helper: launch browser, compose, close."""
    with Composer(headless=headless) as c:
        return c.compose(state, output_dir)


# --------------------------------------------------------------------------- #
# CLI                                                                         #
# --------------------------------------------------------------------------- #


if __name__ == "__main__":
    import sys

    if len(sys.argv) != 3:
        print("usage: python composer.py <lpc-state.json> <output_dir>")
        sys.exit(2)

    state = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    out = Path(sys.argv[2])
    paths = compose(state, out)
    print(json.dumps(paths, indent=2))
