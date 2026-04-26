"""FastAPI sidecar — exposes the LPC character pipeline as HTTP.

Backend (NestJS / TypeScript) calls this service over HTTP to keep the
Python module out of its process.

Endpoints:
    GET  /healthz                 readiness check
    POST /generate-character      synchronous: persona.md text -> assets

Run:
    pip install -r lpc-character-pipeline/requirements.txt
    pip install fastapi uvicorn
    playwright install chromium
    export GEMINI_API_KEY=...

    uvicorn lpc-character-pipeline.scripts.api:app \\
        --host 0.0.0.0 --port 8001 --workers 1

Notes:
- A single warm Composer is held for the lifetime of the process (--workers 1).
- The first request pays the browser+page bootstrap cost (~10-15s); subsequent
  requests reuse the same page (~5s each).
- Response inlines character.png as base64 so the backend doesn't need a shared
  filesystem. Other artifacts (lpc-state, frame-map, credits, trace) inline as
  JSON / text.
"""

from __future__ import annotations

import base64
import json
import os
import sys
import threading
from pathlib import Path
from tempfile import TemporaryDirectory

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

SCRIPTS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS_DIR))

from mapper import map_persona, enforce_color_restrictions, enforce_torso_coverage  # noqa: E402
from composer import Composer, FRAME_MAP  # noqa: E402

MODULE_ROOT = SCRIPTS_DIR.parent
DEFAULT_CATALOG = MODULE_ROOT / "walk-safe-catalog.json"


app = FastAPI(title="lpc-character-svc", version="0.1.0")
_composer_lock = threading.Lock()
_composer: Composer | None = None
_catalog_text: str | None = None


def _get_catalog() -> str:
    global _catalog_text
    if _catalog_text is None:
        _catalog_text = DEFAULT_CATALOG.read_text(encoding="utf-8")
    return _catalog_text


def _get_composer() -> Composer:
    global _composer
    if _composer is None:
        c = Composer(headless=True)
        c.__enter__()
        _composer = c
    return _composer


@app.on_event("shutdown")
def _shutdown() -> None:
    global _composer
    if _composer is not None:
        try:
            _composer.close()
        finally:
            _composer = None


class GenerateRequest(BaseModel):
    persona_md: str = Field(..., description="Full persona.md text")
    agent_id: str | None = Field(None, description="Optional agent id (logging only)")


class GenerateResponse(BaseModel):
    character_png_b64: str
    lpc_state: dict
    frame_map: dict
    credits: str
    mapping_trace: dict


@app.get("/healthz")
def healthz() -> dict:
    return {
        "ok": True,
        "gemini_key_set": bool(os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")),
        "composer_warm": _composer is not None,
    }


@app.post("/generate-character", response_model=GenerateResponse)
def generate_character(req: GenerateRequest) -> GenerateResponse:
    catalog = _get_catalog()

    try:
        mapping = map_persona(req.persona_md, catalog)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"mapper failed: {e}") from e

    state = enforce_torso_coverage(mapping.get("lpc_state") or {}, catalog)
    state = enforce_color_restrictions(state, catalog)
    if not state or not isinstance(state, dict):
        raise HTTPException(status_code=502, detail="mapper returned no lpc_state")

    with _composer_lock, TemporaryDirectory() as tmp:
        out = Path(tmp)
        try:
            composer = _get_composer()
            composer.compose(state, out)
        except Exception as e:  # noqa: BLE001
            raise HTTPException(status_code=502, detail=f"composer failed: {e}") from e

        png_b64 = base64.b64encode((out / "character.png").read_bytes()).decode("ascii")
        lpc_state = json.loads((out / "lpc-state.json").read_text(encoding="utf-8"))
        credits = (out / "CREDITS.txt").read_text(encoding="utf-8")

    return GenerateResponse(
        character_png_b64=png_b64,
        lpc_state=lpc_state,
        frame_map=FRAME_MAP,
        credits=credits,
        mapping_trace={
            "form_fallback_note": mapping.get("form_fallback_note"),
            "trace": mapping.get("trace", []),
            "color_palette_check": mapping.get("color_palette_check", {}),
        },
    )
