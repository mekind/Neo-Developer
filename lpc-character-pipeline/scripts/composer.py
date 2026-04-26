"""Compose LPC sprite assets from an LPC native state JSON via Playwright.

Uses the public LPC Generator UI:
  https://liberatedpixelcup.github.io/Universal-LPC-Spritesheet-Character-Generator/

Outputs (into output_dir):
  - character.png    Spritesheet
  - lpc-state.json   Round-trip Export to Clipboard JSON
  - CREDITS.txt      LPC asset attribution

Requires:
  - pip install playwright
  - playwright install chromium
"""

from __future__ import annotations

import json
import os
import shutil
from pathlib import Path

from playwright.sync_api import sync_playwright, Page, BrowserContext

LPC_URL = os.environ.get(
    "MYCLAW_LPC_URL",
    "https://liberatedpixelcup.github.io/Universal-LPC-Spritesheet-Character-Generator/",
)


def _import_state(page: Page, state: dict) -> None:
    """Inject state JSON via the page clipboard, then click Import."""
    state_json = json.dumps(state)
    # Write to clipboard from the page context (requires clipboard permissions).
    page.evaluate("text => navigator.clipboard.writeText(text)", state_json)
    # Suppress confirm/alert dialogs that the importer may raise.
    page.once("dialog", lambda d: d.accept())
    page.get_by_role("button", name="Import from Clipboard (JSON)").click()
    # Wait for selections to render.
    page.wait_for_timeout(1500)


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


def compose(state: dict, output_dir: Path, *, headless: bool = True) -> dict:
    """Drive the LPC Generator headlessly. Return paths of saved assets."""
    output_dir.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=headless)
        context: BrowserContext = browser.new_context(
            permissions=["clipboard-read", "clipboard-write"],
        )
        page = context.new_page()
        page.goto(LPC_URL, wait_until="networkidle")
        # Open the Download collapsible if collapsed.
        try:
            page.get_by_text("Download", exact=False).first.click(timeout=2000)
        except Exception:
            pass

        _import_state(page, state)

        png_tmp = _click_download(
            page,
            "Spritesheet (PNG)",
            "character-spritesheet.png",
            output_dir,
        )
        # rename to character.png
        char_png = output_dir / "character.png"
        if png_tmp != char_png:
            shutil.move(str(png_tmp), str(char_png))

        credits_tmp = _click_download(
            page,
            "Credits (TXT)",
            "credits.txt",
            output_dir,
        )
        credits_path = output_dir / "CREDITS.txt"
        if credits_tmp != credits_path:
            shutil.move(str(credits_tmp), str(credits_path))

        state_text = _read_export_clipboard(page)
        state_path = output_dir / "lpc-state.json"
        if state_text:
            state_path.write_text(state_text, encoding="utf-8")
        else:
            # Fallback: write the input state we just imported.
            state_path.write_text(
                json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8"
            )

        context.close()
        browser.close()

    return {
        "character_png": str(char_png),
        "lpc_state": str(state_path),
        "credits": str(credits_path),
    }


if __name__ == "__main__":
    import sys

    if len(sys.argv) != 3:
        print("usage: python composer.py <lpc-state.json> <output_dir>")
        sys.exit(2)

    state = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    out = Path(sys.argv[2])
    paths = compose(state, out)
    print(json.dumps(paths, indent=2))
