# 03 — Verify (선택)

> Step 2의 산출물이 persona.md Visual Description과 일치하는지 확인.

## Track A — 사람 눈 (필수, 2분)

`02-character.png`를 열고 다음 8문항 Y/N 체크:

- [ ] **Q1** persona.md Visual Description의 핵심 인상이 살아 있는가? (예: 친근한 신문기자)
- [ ] **Q2** Color Palette의 Primary 색이 캐릭터에 명확히 보이는가? (예: 파란 베레모/캡)
- [ ] **Q3** Color Palette의 Secondary·Accent 색이 어딘가에 반영됐는가?
- [ ] **Q4** Walk-N/W/S/E 4방향이 같은 인물로 보이는가? (LPC native라 자동 보장이지만 확인)
- [ ] **Q5** persona.md에서 묘사된 액세서리 (둥근 안경 등)가 적용되었는가?
- [ ] **Q6** LPC 시트 export 손상 없음? (행 누락/잘림 없음)
- [ ] **Q7** form_fallback이 발동했다면, humanize 결과가 persona의 톤(친근/호기심)을 유지하는가?
- [ ] **Q8** persona.md에 있지만 LPC에 없는 소품(예: 신문)이 빠져서 정체성 식별이 약해졌는가? (Y면 향후 overlay 모듈 우선순위 ↑)

## Track A 추가 — round-trip 확인

- [ ] **R1** `02-lpc-state.json` (LPC가 export한 것)을 다시 Import해도 동일 결과가 나오는가?
- [ ] **R2** `02-lpc-state.json`의 selections 필드가 step 1의 `lpc_state.selections`와 의미적으로 같은가? (LPC가 normalize했을 수 있음)

결과를 `poc/output/03-verify-result.md`에 한 줄씩 기록.

## Track B — Gemini Vision (선택, 5분)

`02-character.png`을 Gemini 채팅에 첨부하고 아래 프롬프트 붙여넣기.

```
This is an LPC-style 64x64 pixel art sprite sheet generated for the persona.md below. Answer Y/N + score 0-100 for each question.

PERSONA.MD:
---
# Agent Persona: 뉴스봇

## Visual Description
파란 베레모를 쓴 친근한 신문기자. 둥근 안경 착용. 작은 신문(또는 메모지)을 들고 있음. 표정은 호기심 많고 친근함. 가벼운 코트 차림.

## Color Palette
- Primary: #4A90D9 (파란색)
- Secondary: #F5A623 (주황색)
- Accent: #FFFFFF (흰색)
---

QUESTIONS:
1. Does the sprite look like a friendly reporter character?
2. Is the blue beret (or closest LPC equivalent — bonnie cap) visible?
3. Are round glasses visible?
4. Are the LPC layers visually consistent across all 4 walk directions?
5. Is the Color Palette (blue primary, orange secondary, white accent) reasonably reflected?
6. If a newspaper accessory is absent, is it a deal-breaker for persona identity?
7. Overall persona match score (0-100): how well does the sprite represent the persona.md?

Answer format:
Q1: Y/N (score) — reason
...
Q7: score (0-100) — overall reason

If Q7 < 70, list specific LPC selection changes (selectionGroup, itemId, variant/recolor) that would improve the match.
```

응답을 `poc/output/03-verify-result.md` 끝에 추가.

## 결과 해석

| Q7 점수 | 결정 |
|---|---|
| ≥ 80 | ✅ PoC 통과. mapping LLM + Import-from-Clipboard 충분 |
| 60~79 | 🟡 부분 통과. enum 사전 보강 또는 prompt 튜닝 |
| < 60 | ❌ mapping 재시도, persona.md schema 보완, 또는 다른 fork 검토 |

## PoC 마무리: 결론 노트

`poc/output/POC-NOTES.md`에 5개 짧은 답:

1. mapping LLM이 LPC native selections JSON을 valid 형식으로 출력했는가?
2. Import-from-Clipboard가 1회 paste로 작동했는가? 실패율은?
3. Step 2 합계 시간이 30초 내였는가?
4. 결과 sprite가 persona.md와 의미적으로 일치하는가?
5. persona.md schema 개선 제안 (있으면 1~3개)

→ 이 답들이 다음 단계(MVP 자동화 = headless browser 또는 자체 composer 결정)의 input.

## 양식 개선 제안 정리

`poc/output/PERSONA-SCHEMA-NOTES.md`에 PoC 진행 중 발견한 모든 약점을 다음 형식으로 정리:

```markdown
# persona.md 양식 개선 제안 (PoC v3 결과)

## 발견된 약점
1. [약점] — 발생: [Step 1 / 2 / 3]
2. ...

## 제안 (3개 이내, 우선순위 순)
### 제안 1: [제목]
- 변경 내용:
- 근거 (PoC 어느 관찰):
- 영향 범위 (mapper / Generator / verify):

### 제안 2: ...

## 폐기/보류
- [수정 안 하기로 한 항목과 이유]
```
