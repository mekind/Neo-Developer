# PoC v3 — persona.md → LPC (Import from Clipboard)

## 컨텍스트

`docs/plan/` 기획문서 우선. **MyClaw**의 에이전트 자산 중 **persona.md(외형 전용) → LPC sprite 이미지** 모듈만 다룸.

## 이번 PoC가 답해야 할 것

1. mapping LLM이 persona.md만 보고 **LPC 네이티브 selections JSON**을 정확히 출력하는가
2. 그 JSON을 LPC Generator의 **"Import from Clipboard"**에 붙이면 1번 paste만으로 캐릭터가 완성되는가
3. 정확성·속도가 3 기준에 부합하는가

## 3가지 기준 (확정)

| 기준 | 충족 방식 |
|---|---|
| **AI 활용** | mapping LLM이 persona의 자연어 → LPC selections JSON 의미 추론 |
| **정확성** | LPC 네이티브 enum (sheet_definitions/) 그대로 사용. 우리 손수 enum 폐기 |
| **속도** | "Import from Clipboard" 1 paste → Download. UI 슬롯 클릭 0회 |

## 흐름

```
persona.md  →  [01] LLM mapping  →  lpc-state.json (LPC 네이티브)
                                          ↓
                                    [02] Import-from-Clipboard → Download (PNG + JSON + TXT)
                                          ↓
                                    [03] 검증 (선택)
```

## 진화 경로 (PoC 후)

| 단계 | 메커니즘 | 비용 |
|---|---|---|
| **PoC (지금)** | 사용자가 mapping JSON을 LPC UI에 paste | 30초/캐릭터 |
| **MVP** | Headless browser (Puppeteer/Playwright)로 paste + download 자동화 | 1~2초/캐릭터 |
| **Production** | 자체 composer (`sheet_definitions/` + `sources/` 직접 합성) | 수백 ms/캐릭터 |

## 파일 순서

| 파일 | 누가 | 무엇을 |
|---|---|---|
| `01-persona-to-lpc.md` | LLM (Claude / Gemini text) | persona.md를 LPC native selections JSON으로 변환 |
| `02-lpc-export.md` | 사용자 (수동, 30초) | JSON paste → Download 3종 (PNG/JSON/TXT) |
| `03-verify.md` | 사용자 + Gemini Vision (선택) | 결과 시트가 persona.md Visual Description과 일치하는지 |

## 산출물 저장 (frontend 인계 패키지)

```
poc/output/
├── 01-mapping-output.json     ← Step 1: LLM이 출력한 LPC native state
├── 02-character.png           ← Step 2: Spritesheet (PNG)
├── 02-lpc-state.json          ← Step 2: Export to Clipboard (JSON) — 재현용
├── 02-CREDITS.txt             ← Step 2: Credits (TXT) — 라이선스 의무
└── 03-verify-result.md        ← Step 3 (선택)
```

→ `02-character.png` + `02-lpc-state.json` + `02-CREDITS.txt` 3개가 frontend 인계 표준. 추가로 `frame-map.json`이 필요한데 LPC 표준 layout이라 frontend 코드에 hardcode 가능.

## 폐기

- 우리가 손으로 만든 enum (`hat=beret`, `top=suit`, `top=labcoat` 등) — 폐기. LPC 네이티브 itemId 직접 사용
- 슬롯별 클릭 절차 — 폐기. paste 1회로 전체 자동
- `02-lpc-url.txt` — 폐기. Export to Clipboard JSON이 동일 정보 + 더 정확

## 시간 예산

- Step 1: 5분
- Step 2: 30초~1분 (paste + 3 download)
- Step 3: 5분 (선택)

총 10분 내 dry run.
