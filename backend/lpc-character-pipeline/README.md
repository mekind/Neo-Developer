# lpc-character-pipeline — MyClaw 캐릭터 이미지 모듈

`persona.md` → LPC sprite 자산 (PNG + state JSON + CREDITS) 자동화.

## 구조

```
backend/lpc-character-pipeline/
├── README.md              ← 이 파일
├── spec.md                ← 모듈 명세
├── lpc-catalog.json       ← LPC 전체 catalog (655 items)
├── requirements.txt       ← Python 의존성 (google-genai, playwright)
├── personas/
│   └── news-bot.md        ← 샘플 persona.md
├── poc/                   ← 수동 dry-run 절차
│   └── lpc-catalog-curated.json   ← 인간/오피스용 subset (mapper 입력)
├── scripts/               ← 풀 자동화 코드
│   ├── mapper.py          ← Gemini → LPC native state JSON
│   ├── composer.py        ← Playwright → spritesheet PNG + assets
│   └── generate_character.py    ← CLI 진입점
└── .example/              ← 샘플 산출물 (commit됨, frontend 참고용)
```

## 사용법

```bash
pip install -r backend/lpc-character-pipeline/requirements.txt
playwright install chromium
export GEMINI_API_KEY=...   # do NOT commit

python backend/lpc-character-pipeline/scripts/generate_character.py \
    backend/lpc-character-pipeline/personas/news-bot.md \
    backend/lpc-character-pipeline/.example/news-bot
```

세부는 `scripts/README.md` 참고.

---

## 라이선스 (LPC 자산)

LPC 자산은 **CC-BY-SA 3.0** + **OGA-BY 3.0**(자산별로 다름)으로 배포됨. 본 모듈이 생성하는 `character.png`는 LPC 자산을 합성한 **파생 저작물**이므로 동일 라이선스 의무가 따라온다.

### 체크리스트

| 항목 | 상태 | 메모 |
|---|---|---|
| frontend 인계 패키지에 `CREDITS.txt` + `frame-map.json` 포함 | ✅ | `composer.py`가 자동 생성 |
| 화면 어딘가에 credit 표기 (예: "Made with LPC assets") | ⚠️ | frontend 구현 시 확인 필요 |
| 캐릭터 PNG 외부 배포 시 CC-BY-SA 명시 | ⚠️ | 배포 정책 결정 시 |
| 우리 코드 라이선스 명시 (LICENSE 파일) | ⚠️ | repo 루트에 LICENSE 없으면 추가 권장 |

### 한 줄 요약

> **CC-BY-SA 3.0이 핵심.** `CREDITS.txt`만 화면에 노출하면 99% 안전.
> 캐릭터 PNG를 외부에 재배포하면 그 PNG도 CC-BY-SA로 풀어야 한다는 **ShareAlike 조항**만 의식하면 충분.

### 출처

- LPC Universal Spritesheet Character Generator: https://github.com/liberatedpixelcup/Universal-LPC-Spritesheet-Character-Generator
- 자산별 기여자·라이선스: 각 캐릭터의 `CREDITS.txt`에 자동 기록됨

---

## 진화 경로

| 단계 | 메커니즘 | 비용 |
|---|---|---|
| **PoC (현재)** | hosted URL + Playwright headless | ~30s/캐릭터 |
| **MVP** | self-host LPC (`npm run dev`) + brower prewarm | ~5s/캐릭터 (warmup 후) |
| **Production** | 자체 composer (sheet_definitions + sources 직접 합성) | 수백 ms/캐릭터 |

세부는 `spec.md` 참고.
