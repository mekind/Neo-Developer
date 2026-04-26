# lpc-pipeline-spec.md (v2)

> **MyClaw — persona.md → 캐릭터 sprite 모듈 명세**
> 작성일: 2026-04-26
> 상태: v2 (v1은 `.archive/lpc-pipeline-spec.v1.md`로 보관)
> 범위: 본 모듈만. 다른 MyClaw 컴포넌트(온보딩, Persona Builder, OpenClaw 런타임, Memory, Gather UI)는 외부 책임

---

## 1. Confirmed Decisions

- 서비스명: **MyClaw**
- 입력 schema: 기획문서 §4.2 `persona.md` (Visual Description / Pixel Art Prompt / Color Palette)
- 외형 생성 = **LPC Universal Spritesheet Character Generator**
  - https://liberatedpixelcup.github.io/Universal-LPC-Spritesheet-Character-Generator/
- 시트 표준: **LPC native 64×64 / 표준 시트, 리사이즈 없음**
- 캐릭터 폼: LPC가 합성 가능한 형태 (인간형 중심)
- 라이선스: CC-BY-SA 3.0 / OGA-BY 3.0, 출처 표기 필수

## 2. 3 기준

| 기준 | 충족 방식 |
|---|---|
| **AI 활용** | mapping LLM이 persona.md → LPC selections JSON 의미 추론 |
| **정확성** | LPC sheet_definitions 그대로 사용. 자체 enum 만들지 않음 |
| **속도** | PoC 30초 (수동 paste) / MVP ~수초 (headless) / Production 수백 ms (자체 composer) |

---

## 3. 파이프라인

```
persona.md (외형 정의)
    ↓
[Mapper LLM]
   - input: persona.md + LPC catalog
   - output: LPC native state JSON (Import-from-Clipboard 호환)
    ↓
[Composer]
   - PoC: 사용자가 LPC UI에 paste → Download
   - MVP: Headless browser 자동화
   - Production: 자체 composer (sheet_definitions + sources)
    ↓
[Frontend 인계 패키지]
   - character.png      (LPC native sprite sheet)
   - lpc-state.json     (재현용 — Import-from-Clipboard로 round-trip)
   - CREDITS.txt        (라이선스 의무)
```

본 모듈 입력은 **persona.md 1개**. 외부 시스템(Persona Builder)이 이 파일을 만들어 본 모듈을 트리거한다. 트리거 시점·방식은 MyClaw 전체 spec의 책임.

---

## 4. LPC Catalog

mapper가 정확한 itemId를 출력하려면 **LPC가 어떤 옵션을 가졌는지** 알아야 한다.

- 출처: LPC repo의 `sheet_definitions/**/*.json`
- 산출물: `lpc-catalog.json` — 단일 파일
- 스키마 (예시):
  ```json
  {
    "bodyTypes": ["male", "female", "teen", "child", "muscular", "pregnant"],
    "selectionGroups": {
      "head": {
        "items": {
          "heads_human_male":   { "name": "Human Male",   "recolors": ["light","tanned",...], "variants": [] },
          "heads_human_female": { "name": "Human Female", "recolors": ["light","tanned",...], "variants": [] }
        }
      },
      "hat": {
        "items": {
          "hat_cap_bonnie":   { "name": "Bonnie",   "variants": ["black","blue","brown",...] },
          "hat_formal_bowler":{ "name": "Bowler",   "variants": [...] }
        }
      },
      "torso": { ... },
      "hair": { ... },
      "facial accessory": {
        "items": {
          "facial_glasses_round": { "name": "Round glasses", "variants": [...] }
        }
      },
      "legs": { ... },
      "feet": { ... }
    }
  }
  ```
- 빌드: LPC repo를 특정 commit으로 받아 1회 추출 스크립트로 생성 (구현 1일차)
- 갱신: LPC repo 업데이트 시 재실행

> 단순화: 본 spec은 catalog의 정확한 형태를 강제하지 않는다. mapper가 읽고 itemId를 정확히 출력할 수 있는 형태면 된다.

---

## 5. Mapper LLM

### 입력
- `persona.md` (Visual Description / Pixel Art Prompt / Color Palette)
- `lpc-catalog.json` (system context)

### 출력 (LPC native state JSON)

```json
{
  "version": 2,
  "bodyType": "male",
  "selections": {
    "<selectionGroup>": {
      "itemId": "<filename without .json>",
      "variant": "<variant name>",
      "recolor": "<color name>",
      "name": "<human readable label>"
    }
  },
  "selectedAnimation": "walk"
}
```

- 위 JSON은 LPC Generator의 **"Import from Clipboard"** 버튼에 그대로 paste 가능
- 생성 모델은 Claude 또는 Gemini text 모델 (둘 다 가능, 비용·정확도 비교는 구현 단계 결정)

### 부산물 (선택)

mapping reasoning trace — 데모 화면에 노출 시 사용. AI 활용 가시화 목적. 본 spec 필수 사항 아님.

### 자연어 처리 정책

- Visual Description의 외형 신호 → 가장 가까운 LPC 옵션
- Pixel Art Prompt의 해상도 힌트(예: "16x16") → 무시. LPC 64×64 고정
- Color Palette의 Primary/Secondary/Accent → 시각 비중이 큰 selection의 variant/recolor에 우선 매칭
- 비인간 폼 묘사(예: 부엉이) → mapper가 자체 판단으로 가장 가까운 인간 폼으로 매핑 (LPC 한계)

---

## 6. Composer

### Phase 1 — PoC (수동, 30초)

LPC Generator 웹페이지에서:
1. `lpc-state.json`을 "Import from Clipboard"에 paste
2. **Spritesheet (PNG)** 다운로드 → `character.png`
3. **Export to Clipboard (JSON)** → `lpc-state.json`로 저장
4. **Credits (TXT)** 다운로드 → `CREDITS.txt`

### Phase 2 — MVP (자동, ~수초)

- 같은 UI를 headless browser(Puppeteer/Playwright)로 구동
- Import → Download 자동화
- LPC 페이지를 self-host(npm run dev) 또는 hosted URL 그대로

### Phase 3 — Production (자체 composer, 수백 ms)

- LPC repo의 `sheet_definitions/` + `sources/spritesheets/` 직접 사용
- Pillow / sharp / canvas 등으로 layer 합성 (zPos 순서 준수)
- 브라우저 부팅 비용 0
- npm 라이브러리 형태 공식 배포는 없음 → 자체 작성 필요

본 spec은 Phase 1·2 우선 채택. Phase 3는 추후 검토.

---

## 7. Frontend 인계 패키지

```
/assets/characters/{agent_id}/
├── character.png       ← LPC sprite sheet (PNG, 알파)
├── lpc-state.json      ← LPC native state (재현·수정용)
└── CREDITS.txt         ← LPC 자산 기여자 목록 (라이선스 의무)
```

### 파일 의미

- **character.png**: 프론트엔드가 화면에 그리는 자산. LPC 표준 layout(13행×N열, 64×64 frame). frontend는 LPC 표준에 맞춰 row/col을 잘라 idle/walk-N/walk-W/walk-S/walk-E 애니메이션 재생
- **lpc-state.json**: 같은 캐릭터를 다시 만들거나 수정할 때 입력. LPC UI에 paste하면 동일 결과
- **CREDITS.txt**: 화면 어딘가에 표기 또는 별도 페이지에 포함. 빠지면 라이선스 위반

### frame layout

LPC native라 모든 캐릭터가 같은 layout. **frontend 코드에 1회 하드코딩**. character마다 별도 frame-map 동봉하지 않음.

---

## 8. AI 활용 가시화 (데모용, 선택)

mapper가 출력하는 reasoning trace를 데모 화면에 typewriter 스타일로 노출 가능:

```
▸ body = light       ← Visual Description: '한국인'에서 추론
▸ hat  = hat_cap_bonnie (blue)  ← '파란 베레모' 매칭
▸ accessory = facial_glasses_round  ← '둥근 안경'
...
```

데모 가시화는 본 모듈 안에서 trace 데이터를 만들어 노출하면 된다. 트레이스 형식은 자유 (`{ key, itemId, reason }` 단위 권장).

본 spec은 이 가시화의 구현을 강제하지 않는다. Demo 단계 선택.

---

## 9. 입출력 요약 한 표

| 단계 | 입력 | 출력 |
|---|---|---|
| Mapper | persona.md + lpc-catalog.json | lpc-state.json (LPC native) |
| Composer (Phase 1) | lpc-state.json (사용자가 paste) | character.png, lpc-state.json (round-trip), CREDITS.txt |
| Composer (Phase 2) | lpc-state.json | 위와 동일 (자동) |
| Frontend 인계 | — | character.png + lpc-state.json + CREDITS.txt |

---

## 10. 가볍게 둔 것 (의도적 비포함)

- mapper 출력 검증/재시도 루프 — 1차 결과 그대로 사용. 깨진 itemId면 LPC import에서 시각적으로 드러남
- LPC fork/commit 버전 고정 정책
- 외부 호출 API/CLI 시그니처 표준화
- frame-map.json 별도 동봉
- 비인간 폼 별도 트랙 (LPC 인간형 fallback으로 일원화)
- 본 모듈 외부 시스템(Persona Builder Agent 등)과의 인터페이스 — MyClaw 전체 spec 책임

---

## 11. 변경 이력

- **v1 (2026-04-26)** — 인간형 한정 / 64×64 native / 자체 enum / 슬롯 매핑. `.archive/lpc-pipeline-spec.v1.md`로 보관
- **v2 (2026-04-26)** — LPC native enum 채택 / Import-from-Clipboard / frontend 인계 3파일(character.png + lpc-state.json + CREDITS.txt). 검증 루프·frame-map·fork pinning·API 시그니처는 의도적으로 가볍게 둠
