# HANDOFF — lpc-character-pipeline

> 다음 세션/개발자에게 인계용 프롬프트. 이 파일을 처음부터 끝까지 읽고 진행하세요.

## 1. 컨텍스트 (1분 안에 파악)

- 프로젝트: **MyClaw** — 비개발자가 대화로 AI 에이전트 만들고 Gather-style 공간에서 도트 캐릭터로 만나 대화하는 플랫폼
- 본 모듈: **lpc-character-pipeline** — `persona.md` (외형 정의) → LPC sprite sheet PNG + 메타 자산
- 작업 디렉토리: `/Users/rs/Git/NeoD/Neo-Developer`
- 브랜치: `feat/lpc-character-pipeline`
- 명세 마스터: `backend/lpc-character-pipeline/spec.md`
- 모듈 README: `backend/lpc-character-pipeline/README.md`

## 2. 파이프라인 (구현 완료)

```
persona.md ─► [mapper.py: Gemini]   ─► lpc-state.pre.json
                                            │
                                            ▼
            [composer.py: Playwright + LPC Generator hosted URL]
                                            │
                                            ▼
        character.png + lpc-state.json + CREDITS.txt + frame-map.json
```

코드 위치:
- `backend/lpc-character-pipeline/scripts/mapper.py` — Gemini 호출
- `backend/lpc-character-pipeline/scripts/composer.py` — Playwright 자동화
- `backend/lpc-character-pipeline/scripts/generate_character.py` — CLI 진입점
- `backend/lpc-character-pipeline/scripts/api.py` — FastAPI sidecar (백엔드 인계용)
- `backend/lpc-character-pipeline/lpc-catalog.json` — LPC 전체 catalog (655 items)
- `backend/lpc-character-pipeline/poc/lpc-catalog-curated.json` — 인간/오피스용 subset (mapper 입력, ~105KB)

산출물 샘플:
- `backend/lpc-character-pipeline/.example/carrot-man/` — 당근봇 (현재 진행 중인 디버그 대상)
- `backend/lpc-character-pipeline/.example/news-bot/` — 뉴스봇

## 3. 현재 상태

| 항목 | 상태 |
|---|---|
| Mapper end-to-end | ✅ 작동 (Gemini 2.5 Flash) |
| Composer Playwright import + download | ✅ 작동 |
| Catalog enrichment (recolors palette resolution) | ✅ 완료 |
| frame-map.json 자동 생성 | ✅ |
| Frontend 인계 4파일 패키지 | ✅ |
| FastAPI sidecar (`scripts/api.py`) | ✅ 작성, 미실행 검증 |
| **Body layer round-trip 후 누락** | ❌ **미해결** |
| **손/팔 skin이 안 보임** | ❌ 위 이슈의 시각적 결과 |

## 4. 미해결 핵심 이슈 (당장 해결 필요)

### 증상
- `backend/lpc-character-pipeline/.example/carrot-man/character.png` walk row(N/W/S/E)에서 **손이 안 보임**
- round-trip `lpc-state.json`의 selections에 `body` / `head` / `expression` 항목이 사라짐 (mapper의 `lpc-state.pre.json`에는 있음)

### 시도한 디버그
1. `_sanitize_state()`에서 null selection 제거 — 진전 없음
2. Pre-state에 body/head/expression 강제 삽입 — round-trip 후에도 사라짐
3. 명시적 `window.canvasRenderer.renderCharacter(selections, bodyType)` await — 진전 없음

### 가설 (검증 필요)

**가설 A**: LPC의 `applyMatchBodyColor` 또는 다른 state 변환이 import 후 body/head/expression을 제거한다.
- 검증: composer에서 import 직후 `await page.evaluate("() => Object.keys(state.selections)")` 로 selections 키 확인. 단 `state`는 window에 직접 노출 안 됨 — `import('./state/state.js').then(m => m.state)` 통해 접근 가능할 수 있음
- 코드 참조: `/tmp/lpc-gen/sources/state/state.js:155-195` `applyMatchBodyColor`
- 확인 포인트: import 직후 vs `renderCharacter` 호출 후 vs Export to Clipboard 직후 selections 비교

**가설 B**: Export to Clipboard JSON이 selections 일부를 stripping한다.
- 검증: `/tmp/lpc-gen/sources/state/json.js:exportStateAsJSON` 함수 정독. `state.selections`를 그대로 직렬화하는지 확인
- 1차 검토 결과: 직렬화는 그대로지만 어딘가에서 selections 가지치기를 함

**가설 C**: 우리가 import한 selections 형태가 LPC가 기대하는 형태와 다르다.
- LPC 정상 selection: `{ itemId, subId, variant, recolor, name }`
- 우리가 보낸: `{ itemId, variant, recolor, name }` (subId 없음)
- 검증: `subId: null`을 명시 추가. 단 round-trip에서 `subId: None` 보임 → 이미 처리되는 듯

### 다음 검증 단계 (순서대로)

1. **composer.py에 디버그 로깅 추가**:
   ```python
   page.evaluate("""async () => {
       const m = await import('./state/state.js');
       console.log('SELECTIONS_AFTER_IMPORT', JSON.stringify(Object.keys(m.state.selections)));
   }""")
   ```
   → headed 모드(`--no-headless`)로 실행해 DevTools console에서 추적

2. **확인 포인트**:
   - 우리가 `_sanitize_state` 후 보낸 키 (정상이면 body 포함)
   - Import 직후 state.selections 키
   - renderCharacter 호출 후 state.selections 키
   - Export to Clipboard 호출 후 결과 JSON의 selections 키

3. 만약 Import 직후엔 body가 있는데 render 후 사라지면 → 가설 A 확정. 답은 `applyMatchBodyColor` 또는 catalog metadata와의 상호작용

4. 만약 Import 직후 이미 body가 없으면 → `importStateFromJSON` 또는 그 호출자가 selections를 가지치기. `/tmp/lpc-gen/sources/state/` 정독

## 5. 회피책 (시간 부족 시)

`composer.py`의 `_save_outputs()` 직전, 체크포인트 검증 추가하고 누락 시 retry:
- body가 round-trip에 없으면 page.evaluate로 강제 주입 후 재렌더 + 재export

또는 Export 결과에서 누락된 키를 mapper의 pre-state로 보강 (`{**round_trip, **{k:v for k,v in pre.items() if k not in round_trip}}`).

단 이건 **렌더는 여전히 누락** — 표시 PNG 자체는 안 고쳐짐. 진짜 문제는 LPC가 body를 안 그리는 것.

## 6. LPC 저장소 (디버그 시 참조)

로컬 clone: `/tmp/lpc-gen/`

핵심 파일:
- `sources/state/state.js` — selections 관리
- `sources/state/json.js` — import/export JSON
- `sources/canvas/renderer.js:117` — `renderCharacter` 함수
- `sources/state/catalog.js` — `isLayersReady`, palette resolution
- `sheet_definitions/body/body.json` — body 메타 (`match_body_color: true`)
- `palette_definitions/body/` — skin recolor palettes

## 7. 실행 / 검증 방법

```bash
cd /Users/rs/Git/NeoD/Neo-Developer

# 환경
source .venv/bin/activate   # 이미 만들어져 있음
export GEMINI_API_KEY=$(grep '^GEMINI_API_KEY=' .env | head -1 | cut -d= -f2)

# 풀 파이프라인
python backend/lpc-character-pipeline/scripts/generate_character.py \
    backend/lpc-character-pipeline/personas/news-bot.md \
    backend/lpc-character-pipeline/.example/news-bot

# Composer 단독 (mapping 결과 재사용)
python backend/lpc-character-pipeline/scripts/composer.py \
    backend/lpc-character-pipeline/.example/carrot-man/lpc-state.pre.json \
    backend/lpc-character-pipeline/.example/carrot-man

# headed 디버그
python backend/lpc-character-pipeline/scripts/generate_character.py \
    persona.md output_dir --no-headless

# 결과 검증
python -c "
import json
d = json.load(open('backend/lpc-character-pipeline/.example/carrot-man/lpc-state.json'))
print(list((d.get('selections') or {}).keys()))
"

# walk/idle crop
python -c "
from PIL import Image
img = Image.open('backend/lpc-character-pipeline/.example/carrot-man/character.png')
img.crop((0, 512, 832, 768)).save('/tmp/walk.png')
img.crop((0, 1408, 832, 1664)).save('/tmp/idle.png')
"
```

## 8. 인계 자료

### 백엔드(NestJS) 개발자에게
- `backend/lpc-character-pipeline/scripts/api.py` 가 FastAPI sidecar
- 기동 명령: `uvicorn lpc-character-pipeline.scripts.api:app --port 8001 --workers 1`
- 엔드포인트: `POST /generate-character`, `GET /healthz`
- 요청/응답 schema는 `api.py`의 `GenerateRequest` / `GenerateResponse`
- 의존성: `backend/lpc-character-pipeline/requirements.txt`
- 환경변수: `GEMINI_API_KEY`

### 프론트엔드 개발자에게
- 폴더: `backend/lpc-character-pipeline/.example/carrot-man/` (현재 손 누락 상태)
  - `character.png` — 832×3456 sprite sheet
  - `frame-map.json` — walk_n/w/s/e + idle_n/w/s/e 좌표·frames·fps
  - `CREDITS.txt` — 라이선스 표기 의무
  - `lpc-state.json` — 재현용
- 가이드: `backend/lpc-character-pipeline/README.md` "프론트엔드 개발자에게" 섹션
- **주의**: 현재 carrot-man은 손이 안 보이는 미해결 이슈가 있음. 이슈 해결 후 재배포 예정. 그 사이에는 `.example/news-bot/` 으로 작업 가능 (역시 같은 이슈 가능성 있음)

## 9. 라이선스

LPC 자산: CC-BY-SA 3.0 / OGA-BY 3.0
- `CREDITS.txt`를 화면 어딘가 노출 필수
- 캐릭터 PNG 외부 배포 시 CC-BY-SA 명시 필요 (ShareAlike)

## 10. 미결 + 백로그 (참고)

- 일부 비핵심 애니메이션 행에서 의상 누락 — LPC 자산의 per-animation 커버리지 한계. walk/idle만 쓰면 무관
- 본 모듈 외부 호출 인터페이스 (Persona Builder Agent ↔ 본 모듈) — MyClaw 전체 spec 책임
- 검증/재시도 루프 — `spec.md` §10에 의도적으로 가볍게 둠

---

**즉시 할 일 우선순위**:
1. (P0) §4 body/head/expression 누락 디버그 — §4 가설 A·B 순서대로 검증
2. (P1) 픽스 후 .example/carrot-man + .example/news-bot 재생성, commit & push
3. (P2) FastAPI sidecar 한 번 실행해 healthz / generate-character 응답 확인
