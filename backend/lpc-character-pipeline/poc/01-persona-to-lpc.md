# 01 — persona.md → LPC Native State JSON

> Claude 또는 Gemini text 모델 채팅에 **`poc/lpc-catalog-curated.json` 파일을 첨부**하고, 아래 코드블록을 붙여넣어라.
> 출력 JSON을 `poc/output/01-mapping-output.json`에 그대로 저장.
> 출력의 `lpc_state` 부분이 LPC Generator의 **"Import from Clipboard"**에 그대로 paste 가능.

> **catalog**: `poc/lpc-catalog-curated.json` (~89KB / 22K tokens, 29 selectionGroup, 373 items). 인간/오피스 페르소나 전용 curated subset.

```
You are mapping a MyClaw agent persona.md to LPC Universal Spritesheet
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
- selections object should include at minimum: body, head, expression, hair, hat (or none), facial_eyes (if persona mentions glasses), and one torso item from {clothes, jacket, vest}, plus legs, shoes.
- "recolor" applies mainly to body, head (skin tones). For clothing, use "variant" instead.
- If persona is non-human (e.g., owl), set form_fallback_note explaining the humanization. Output state must remain valid LPC humanoid.
- Resolution hints inside Pixel Art Prompt (e.g., "16x16") are IGNORED.
  We use LPC native 64x64.
- selectedAnimation = "walk".
- Glasses live in selectionGroup "facial_eyes" (NOT "accessory").
- If you cannot find a close match for some persona detail, set the
  selection to a reasonable default and note the gap in the trace.

Final output FORMAT:
{
  "lpc_state": {
    "version": 2,
    "bodyType": "...",
    "selections": { ... },
    "selectedAnimation": "walk"
  },
  "form_fallback_note": null | "...",
  "trace": [
    { "selectionGroup": "body", "itemId": "body", "recolor": "light",
      "reason": "Visual Description의 ... 에서 추론" },
    ...
  ],
  "color_palette_check": {
    "persona_palette": ["#...", ...],
    "applied_lpc_colors": ["hat=blue (Primary 매칭)", ...],
    "missing_palette_colors": ["..."]
  }
}

PERSONA.MD:
---
---
type: agent-persona
agent_id: news-bot-001
created: 2026-04-26
---

# Agent Persona: 뉴스봇

## Visual Description
파란 베레모를 쓴 친근한 신문기자. 둥근 안경 착용. 작은 신문(또는 메모지)을 들고 있음. 표정은 호기심 많고 친근함. 가벼운 코트 차림. 동네 소식을 부지런히 물어다주는 인상.

## Pixel Art Prompt
"friendly reporter character, blue beret, round glasses, holding small newspaper, curious friendly expression, light coat, 16x16 pixel art style, warm colors"

## Color Palette
- Primary: #4A90D9 (파란색 — 베레모)
- Secondary: #F5A623 (주황색 — 신문/포인트)
- Accent: #FFFFFF (흰색 — 셔츠/내부)
---

Now, using the attached catalog, output the JSON.
```

## 출력 처리

1. LLM 응답 → `poc/output/01-mapping-output.json`로 저장
2. `lpc_state` 부분만 별도 클립보드 복사 → Step 2에서 paste
3. 검증:
   - 모든 itemId가 `lpc-catalog-curated.json`에 존재하는가
   - variants가 해당 itemId의 variants 목록 내에 있는가
   - `selections`에 최소 필수 group 다 들어 있는가 (body, head, expression, hair, 의상 1개, legs, shoes)

## 다음 단계

`poc/02-lpc-export.md`로 이동.
