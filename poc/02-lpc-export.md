# 02 — Import & Download (수동, 30초)

> Step 1의 LPC native state JSON을 LPC Generator에 import → 3개 자산 다운로드.
> 슬롯 클릭 0회. paste + click 4번이면 끝.

## Generator URL

https://liberatedpixelcup.github.io/Universal-LPC-Spritesheet-Character-Generator/

## 절차

### 2-1. mapping JSON 클립보드 복사

`poc/output/01-mapping-output.json`을 열어 **`lpc_state` 부분만** 클립보드에 복사.

```
{ "version": 2, "bodyType": "...", "selections": {...}, "selectedAnimation": "walk" }
```

trace나 form_fallback_note는 빼고 lpc_state 객체만 복사.

### 2-2. Generator에서 Import

1. 위 URL 접속
2. 화면 어딘가의 **Download** 섹션 펼치기 (좌측 패널 아래쪽)
3. **"Import from Clipboard (JSON)"** 버튼 클릭
4. 브라우저가 클립보드 권한 요청하면 허용
5. "Imported successfully!" alert 확인 → 캐릭터가 자동으로 그려짐

### 2-3. 3개 자산 다운로드

같은 Download 섹션에서 다음 3개 버튼을 순서대로 클릭:

| 버튼 | 받은 파일 → 저장 경로 |
|---|---|
| **Spritesheet (PNG)** | `character-spritesheet.png` → `poc/output/02-character.png`로 rename |
| **Export to Clipboard (JSON)** | 클립보드 텍스트 → 파일로 저장: `poc/output/02-lpc-state.json` |
| **Credits (TXT)** | `credits.txt` → `poc/output/02-CREDITS.txt`로 rename |

### 2-4. import 실패/문제 발생 시

| 상황 | 처리 |
|---|---|
| **"Failed to import" alert** | JSON에 누락 필드(`version`, `bodyType`, `selections`) 또는 itemId 오타. Step 1로 돌아가 mapper에게 "Invalid JSON, version=2와 selections는 필수"로 재요청 |
| **import 됐지만 캐릭터 일부가 안 보임** | itemId가 LPC에 없는 값. 콘솔 (DevTools F12) 확인 → 누락 itemId를 mapper trace에서 찾아 폴백 적용 후 paste 다시 |
| **색이 이상함** | recolor / variant가 itemId에서 지원되지 않음. UI에서 해당 카테고리 클릭해 사용 가능 색으로 수동 조정 후 다시 Export 받기 |
| **클립보드 권한 차단** | 브라우저 설정에서 LPC Generator 사이트의 클립보드 접근 허용 |

### 2-5. 검증 (다음 step 전 빠른 체크)

다운로드한 PNG에 대해:

- [ ] LPC 표준 시트 크기 (대략 832×1344)
- [ ] 배경 알파 투명
- [ ] walk(N/W/S/E) 4방향 행 모두 존재
- [ ] persona.md Visual Description 핵심 인상 식별 가능 (베레모·안경·코트 등 P0 features)

`02-lpc-state.json`이 step 1 출력의 `lpc_state`와 round-trip 일치하는지도 확인 (LPC가 일부 필드 normalize할 수 있음).

## 시간 측정 (PoC 평가 입력)

| 단계 | 측정 시간 |
|---|---|
| 2-1 클립보드 복사 | __초 |
| 2-2 Import 클릭 ~ 캐릭터 표시 | __초 |
| 2-3 3개 다운로드 + rename | __초 |
| **합계** | __초 |

→ "30초 내 완료" 가설 검증. 60초 초과 시 PoC 결론 노트에 병목 기록.

## persona.md 양식 개선 input 누적

`poc/output/PERSONA-SCHEMA-NOTES.md`에 다음 추가:
- mapper가 LPC native enum을 정확히 받았는가 (selections 필드 누락/오타 빈도)
- form_fallback_note가 발동했는가 (비인간 → 인간 매핑 시점)
- color_palette_check.missing_palette_colors의 항목 (LPC 색 enum 한계)

## 다음 단계

`poc/03-verify.md`로 이동 (선택).
