# Persona Builder Agent — QA Scenarios

> **대상 에이전트**: `agents/persona-builder.md`
> **출력 스키마**: `skills/output-schemas/persona.schema.json`, `soul.schema.json`, `config.schema.json`
> **출력 템플릿**: `skills/memory-manager/templates/persona.md.template`, `soul.md.template`, `config.md.template`
> **테스트 방식**: 수동 대화 테스트 (Claude primary agent 세션)
> **시나리오 수**: 21 (QA-P-01 ~ QA-P-21)

---

## 공통 전제 조건

| 항목 | 값 |
|---|---|
| 에이전트 모드 | `primary` |
| 모델 | `anthropic/claude-sonnet-4.5` |
| 권한 | edit: allow, bash: allow, webfetch: allow |
| 사용자 언어 | 한국어 |
| Memory 초기 상태 | 시나리오별 명시 (기본: profile.md 존재, interests 있음) |

## 공통 출력 스키마 검증 항목

생성 완료 시나리오(QA-P-01, QA-P-02, QA-P-03, QA-P-04, QA-P-05, QA-P-06, QA-P-16, QA-P-17, QA-P-18)에서 아래 3종 파일을 검증한다.

### persona.md 검증

| 필드 경로 | 필수 | 검증 |
|---|---|---|
| `frontmatter.type` | ✅ | `"agent-persona"` 고정 |
| `frontmatter.agent_id` | ✅ | 비어 있지 않음, minLength 1 |
| `frontmatter.created` | ✅ | `YYYY-MM-DD` 형식 |
| `content.visual_description` | ✅ | 비어 있지 않음 |
| `content.pixel_art_prompt` | ✅ | 비어 있지 않음 |
| `content.color_palette.primary` | ✅ | `#RRGGBB` 형식 (`^#[0-9A-Fa-f]{6}$`) |
| `content.color_palette.secondary` | ✅ | `#RRGGBB` 형식 |
| `content.color_palette.accent` | ✅ | `#RRGGBB` 형식 |

### SOUL.md 검증

| 필드 경로 | 필수 | 검증 |
|---|---|---|
| `frontmatter.type` | ✅ | `"agent-soul"` 고정 |
| `frontmatter.agent_id` | ✅ | persona.md의 agent_id와 동일 |
| `frontmatter.model` | ✅ | 비어 있지 않음 |
| `content.identity` | ✅ | 비어 있지 않음 |
| `content.personality.tone` | ✅ | 배열, minItems 1 |
| `content.personality.verbosity` | ✅ | 비어 있지 않음 |
| `content.personality.emoji_usage` | ✅ | 비어 있지 않음 |
| `content.personality.language` | ✅ | `Korean` / `English` / `Japanese` / `Chinese` / `mixed` 중 하나 |
| `content.personality.formality` | ✅ | `존댓말` 또는 `반말` |
| `content.greetings_alert` | ✅ | 배열, minItems 1 |
| `content.greetings_approach` | ✅ | 배열, minItems 1 |
| `content.behavior_rules` | ✅ | 배열, minItems 1 |
| `content.boundaries` | ✅ | 배열, minItems 1 |

### config.md 검증

| 필드 경로 | 필수 | 검증 |
|---|---|---|
| `frontmatter.type` | ✅ | `"agent-config"` 고정 |
| `frontmatter.agent_id` | ✅ | 다른 2파일과 동일 |
| `content.skills[].name` | ✅ | 비어 있지 않음 |
| `content.skills[].enabled` | ✅ | boolean |
| `content.skills[].purpose` | ✅ | 비어 있지 않음 |
| `content.skills[].triggers` | ✅ | 배열, minItems 1 |
| `content.schedule.type` | ✅ | `"cron"` 고정 |
| `content.schedule.expression` | ✅ | 비어 있지 않음 |
| `content.schedule.action` | ✅ | 비어 있지 않음 |
| `content.channels.primary` | ✅ | 비어 있지 않음 |
| `content.channels.fallback` | ✅ | 비어 있지 않음 |
| `content.memory.user_context` | ✅ | `../profile.md` 기준 |
| `content.memory.agent_memory` | ✅ | 비어 있지 않음 |

### 3종 파일 일관성 검증

| 검증 항목 | 설명 |
|---|---|
| agent_id 일치 | 3파일 모두 동일한 agent_id |
| 역할 축 일치 | persona 외형, soul 정체성, config skill이 같은 역할을 가리킴 |
| 말투 일치 | soul formality와 greetings 배열의 어투가 일관적 |
| 스키마 밖 필드 없음 | 기획에 없는 필드가 추가되지 않음 |

---

## QA-P-01: Clear Request — 명확한 생성 요청 (Happy Path)

### 목적

명확한 에이전트 생성 요청이 확인 → 승인 → 파일 3종 생성까지 정상 경로를 밟는지 확인한다.

### 전제 조건

- Memory: profile.md 존재 (name: 민지, purpose: 정보 수집, interests: [IT, 스타트업])
- agents/index.md: 빈 목록 (에이전트 0개)

### 입력 / 단계

| 턴 | 사용자 입력 | 기대하는 에이전트 행동 |
|---|---|---|
| 1 | `경쟁사 블로그 알림 봇 만들어줘` | 역할 추출 → Memory 참고 → 빠진 정보(대상) 질문 |
| 2 | `A사, B사, C사 블로그` | 대상 수용 → 시점 질문 |
| 3 | `매일 아침에` | 시점 수용 → 확인 요약 제시 |
| 4 | `좋아` | 승인 → persona.md + SOUL.md + config.md 생성 |

### 기대 결과

- 질문 수: 2~3개 (대상, 시점, 선택적으로 채널)
- 확인 요약에 이름/역할/대상/시점/채널/말투/모습 포함
- 기본값 사용 시 요약에 명시
- 3종 파일 생성, agent_id 일치

### Pass 기준

- [ ] Memory에서 관심사/선호를 읽어 질문 감소
- [ ] 확인 요약이 7개 항목(이름, 하는 일, 대상, 시점, 채널, 말투, 모습) 포함
- [ ] 승인 후 3종 파일 생성
- [ ] persona.md 스키마 통과
- [ ] SOUL.md 스키마 통과 (greetings_alert, greetings_approach 배열)
- [ ] config.md 스키마 통과 (schedule.type = "cron")
- [ ] 3종 agent_id 일치

### Fail 기준

- [ ] Memory 무시하고 관심사 재질문
- [ ] 확인 없이 바로 생성
- [ ] 스키마 밖 필드 추가
- [ ] greetings_alert/greetings_approach가 배열이 아닌 문자열

### 캡처할 증거

- 확인 요약 전문
- 생성된 3종 파일 내용
- agent_id 값 비교

---

## QA-P-02: Complaint Input — 불만/문제 토로형

### 목적

사용자가 불만/귀찮음을 표현했을 때, 짧게 공감 후 에이전트 생성 방향으로 연결하는지 확인한다.

### 전제 조건

- Memory: profile.md 존재

### 입력 / 단계

| 턴 | 사용자 입력 | 기대하는 에이전트 행동 |
|---|---|---|
| 1 | `아 맨날 블로그 확인하는 거 너무 귀찮아` | 짧은 공감 + "대신 해주는 친구 만들 수 있어요" + 대상 질문 |
| 2 | `경쟁사 3개 블로그` | 대상 수용 → 시점 질문 |
| 3 | `아침에` | 시점 수용 → 확인 요약 |
| 4 | `이대로` | 승인 → 생성 |

### 기대 결과

- 감정에 장문 공감하지 않음 (1~2문장 이내)
- 바로 에이전트 생성 흐름으로 전환
- 질문 2~3개 이내

### Pass 기준

- [ ] 불만 수용이 2문장 이내
- [ ] 바로 대상 질문으로 전환
- [ ] 상담사처럼 행동하지 않음
- [ ] 생성 완료 시 3종 파일 스키마 통과

### Fail 기준

- [ ] 감정에 3문장 이상 공감
- [ ] "많이 힘드시겠네요" 같은 상담 흐름
- [ ] 에이전트 생성 방향으로 연결하지 못함

### 캡처할 증거

- 첫 응답의 공감 부분 길이
- 대상 질문 시점

---

## QA-P-03: Vague Request — 모호한 요청

### 목적

사용자가 뭘 원하는지 불명확할 때, 탐색 질문으로 역할을 끌어내는지 확인한다.

### 전제 조건

- Memory: profile.md 존재

### 입력 / 단계

| 턴 | 사용자 입력 | 기대하는 에이전트 행동 |
|---|---|---|
| 1 | `뭔가 알아서 해주는 거 있으면 좋겠어` | 탐색 질문 ("요즘 반복적으로 하는 일 중에 귀찮은 게 뭐예요?") |
| 2 | `회의 일정 확인하는 거` | 역할 파악 → 시점 질문 |
| 3 | `8시 반` | 시점 수용 → 확인 요약 |
| 4 | `만들어줘` | 승인 → 생성 |

### 기대 결과

- 예시를 2~4개 간결하게 제시 가능
- 너무 긴 옵션 목록 없음
- 역할 파악 후 정상 생성 흐름

### Pass 기준

- [ ] 탐색 질문이 자연스럽고 1개
- [ ] 예시 제시 시 4개 이하
- [ ] 역할 파악 후 필수 정보 질문으로 이어짐
- [ ] 총 질문 3~4개 이내

### Fail 기준

- [ ] 바로 거절 ("뭘 원하는지 모르겠어요")
- [ ] 5개 이상 긴 옵션 목록
- [ ] 탐색 없이 임의로 에이전트 결정

### 캡처할 증거

- 탐색 질문 내용
- 역할 파악까지의 턴 수

---

## QA-P-04: Example Reference — 예시 언급형

### 목적

"친구가 쓰는 걸 봤는데" 같은 예시 언급에서 실제 역할을 역추적하는지 확인한다.

### 전제 조건

- Memory: profile.md 존재

### 입력 / 단계

| 턴 | 사용자 입력 | 기대하는 에이전트 행동 |
|---|---|---|
| 1 | `친구가 매일 아침 뉴스 요약해주는 봇 쓰는데 그런 거 나도 갖고 싶어` | "어떤 뉴스를 알려줬는지" 확인 질문 |
| 2 | `IT 뉴스` | 대상 수용 → 채널 질문 |
| 3 | `여기서` | 채널 수용 → 확인 요약 |
| 4 | `좋아` | 승인 → 생성 |

### Pass 기준

- [ ] 예시의 겉모습이 아니라 하는 일(역할)을 먼저 파악
- [ ] "어떤 거였어요?" / "뭘 알려줬는지" 같은 역추적 질문
- [ ] 불필요한 기능 추가 없이 사용자 요청에 맞춰 생성

### Fail 기준

- [ ] "그 앱 이름이 뭐예요?" 같은 외부 제품 질문
- [ ] 예시를 무시하고 처음부터 탐색

### 캡처할 증거

- 역추적 질문 내용
- 최종 확인 요약

---

## QA-P-05: Compound Request — Split (따로 만들기)

### 목적

복합 요청에서 사용자가 "따로 만들기"를 선택했을 때, 하나씩 순차적으로 진행하는지 확인한다.

### 전제 조건

- Memory: profile.md 존재, agents/index.md 에이전트 0개

### 입력 / 단계

| 턴 | 사용자 입력 | 기대하는 에이전트 행동 |
|---|---|---|
| 1 | `블로그도 보고 유튜브 새 영상도 알려주고 그랬으면 좋겠어` | 복합 인식 → "따로/합쳐서" 선택 질문 |
| 2 | `따로` | 첫 번째(블로그) 상세 질문 시작 |
| 3~5 | (블로그봇 상세 입력) | 첫 번째 에이전트 확인 → 승인 → 생성 |
| 6~8 | (유튜브봇 상세 입력) | 두 번째 에이전트 확인 → 승인 → 생성 |

### Pass 기준

- [ ] 복합 요청 인식 → 분리/합치기 선택 먼저 제시
- [ ] 자동으로 합치지 않음
- [ ] 각 에이전트별 별도 확인 요약 + 승인
- [ ] 각각 독립된 agent_id

### Fail 기준

- [ ] 사용자 확인 없이 자동 합치기
- [ ] 하나만 만들고 나머지 무시

### 캡처할 증거

- 분리/합치기 선택 질문
- 2개 에이전트 각각의 확인 요약

---

## QA-P-06: Compound Request — Merge (합쳐서 만들기)

### 목적

복합 요청에서 "합쳐서"를 선택했을 때 하나의 에이전트에 여러 Skill이 들어가는지 확인한다.

### 전제 조건

- Memory: profile.md 존재

### 입력 / 단계

| 턴 | 사용자 입력 | 기대하는 에이전트 행동 |
|---|---|---|
| 1 | `블로그도 보고 유튜브 새 영상도 알려줬으면` | 복합 인식 → 분리/합치기 선택 |
| 2 | `합쳐서` | 대상 질문 (블로그+유튜브 합산) |
| 3 | `A사 블로그랑 B채널` | 대상 수용 → 시점 질문 |
| 4 | `아침에` | 확인 요약 (하나의 에이전트) |
| 5 | `이대로` | 승인 → 생성 |

### Pass 기준

- [ ] 하나의 에이전트로 생성
- [ ] config.md의 skills 배열에 2개 이상 skill 항목 포함
- [ ] 확인 요약에 "블로그 + 유튜브" 역할이 모두 표시

### Fail 기준

- [ ] 2개 에이전트로 분리 생성
- [ ] skills 배열에 하나만 포함

### 캡처할 증거

- config.md의 skills 배열 내용
- 확인 요약 전문

---

## QA-P-07: Out-of-Scope — 날씨 질문 거절

### 목적

범위 밖 요청(날씨)을 짧게 거절하고 에이전트 생성 방향으로 유도하는지 확인한다.

### 전제 조건

- Memory: profile.md 존재

### 입력 / 단계

| 턴 | 사용자 입력 | 기대하는 에이전트 행동 |
|---|---|---|
| 1 | `오늘 날씨 어때?` | 거절 + 에이전트 생성 유도 |

### 기대 결과

- 거절 2줄 이내: (1) 에이전트 정의 전용임을 밝힘 (2) 날씨 알려주는 친구 만들기 제안

### Pass 기준

- [ ] 날씨를 직접 답하지 않음
- [ ] 거절 메시지 3문장 이하
- [ ] 에이전트 생성 방향 유도 포함
- [ ] "날씨 알려주는 친구를 만들어드릴까요?" 같은 제안

### Fail 기준

- [ ] 날씨 정보 제공
- [ ] 장문 사과
- [ ] 에이전트 생성 유도 없이 끝남

### 캡처할 증거

- 거절 응답 전문

---

## QA-P-08: Out-of-Scope — 감정 상담 거절

### 목적

감정 상담 요청을 짧게 거절하고 대화 친구 에이전트 생성으로 유도하는지 확인한다.

### 전제 조건

- Memory: profile.md 존재

### 입력 / 단계

| 턴 | 사용자 입력 | 기대하는 에이전트 행동 |
|---|---|---|
| 1 | `요즘 너무 힘들어. 이야기 좀 들어줘.` | 짧은 거절 + 대화 친구 에이전트 제안 |

### Pass 기준

- [ ] 감정 상담을 시작하지 않음
- [ ] "기분 전환용 대화 친구를 만들어볼까요?" 같은 제안
- [ ] 과한 공감 없음 ("많이 힘드시겠네요" 같은 상담 톤 금지)

### Fail 기준

- [ ] 상담 대화 시작
- [ ] 3문장 이상 공감
- [ ] 에이전트 생성 유도 없음

### 캡처할 증거

- 거절 응답 전문

---

## QA-P-09: Out-of-Scope — 계산/검색 거절

### 목적

계산이나 검색 대행 요청을 거절하고 해당 기능의 에이전트 만들기를 제안하는지 확인한다.

### 전제 조건

- Memory: profile.md 존재

### 입력 / 단계

| 턴 | 사용자 입력 | 기대하는 에이전트 행동 |
|---|---|---|
| 1 | `최근 애플 주가 알려줘` | 거절 + 정보 검색 에이전트 생성 제안 |

### Pass 기준

- [ ] 주가를 직접 답하지 않음
- [ ] "찾아주는 친구를 만들어볼까요?" 같은 유도
- [ ] 거절 3문장 이하

### Fail 기준

- [ ] 검색/계산 결과 제공
- [ ] 에이전트 생성 유도 없음

### 캡처할 증거

- 거절 응답 전문

---

## QA-P-10: Agent Modification — 기존 에이전트 수정

### 목적

기존 에이전트의 특정 속성만 수정하고, 나머지는 유지하는지 확인한다.

### 전제 조건

- Memory: profile.md 존재
- agents/index.md: `news-bot-001` 에이전트 존재 (아침 8시 알림)

### 입력 / 단계

| 턴 | 사용자 입력 | 기대하는 에이전트 행동 |
|---|---|---|
| 1 | `뉴스봇 알림 시간을 점심으로 바꿔줘` | 대상 에이전트 특정 → 변경 내용 파악 |
| 2 | (필요시 추가 확인) | 수정 확인 요약 |
| 3 | `응` | 수정 실행 |

### Pass 기준

- [ ] 대상 에이전트를 정확히 특정
- [ ] 변경 항목만 수정 (알림 시간)
- [ ] 수정하지 않는 항목(이름, 역할, 말투 등) 유지
- [ ] 수정 확인 요약 제시
- [ ] config.md의 schedule.expression만 변경

### Fail 기준

- [ ] 대상 에이전트 미특정 상태에서 수정
- [ ] 관련 없는 항목까지 변경
- [ ] 확인 없이 수정

### 캡처할 증거

- 수정 확인 요약
- 변경 전/후 schedule.expression

---

## QA-P-11: Agent Deletion — 에이전트 삭제

### 목적

삭제 요청 시 대상 확인 + 되돌리기 경고 + 승인 후 삭제하는지 확인한다.

### 전제 조건

- Memory: profile.md 존재
- agents/index.md: `content-bot-001` 에이전트 존재

### 입력 / 단계

| 턴 | 사용자 입력 | 기대하는 에이전트 행동 |
|---|---|---|
| 1 | `콘텐츠봇 이제 안 쓸래. 지워줘` | 삭제 대상 확인 + "정말 지울까요?" |
| 2 | `응` | 삭제 실행 |

### Pass 기준

- [ ] 삭제 대상 명확히 확인
- [ ] 되돌리기 어려움을 짧게 안내
- [ ] 승인 후에만 삭제 실행
- [ ] 새 파일 3종 생성하지 않음

### Fail 기준

- [ ] 확인 없이 즉시 삭제
- [ ] 삭제 대상 불명확
- [ ] 삭제 후 새 에이전트 생성 시도

### 캡처할 증거

- 삭제 확인 메시지
- 삭제 대상 agent_id

---

## QA-P-12: Ideation — 뭘 만들지 모르는 사용자

### 목적

"뭘 만들어야 할지 모르겠어" 같은 구상 요청에 짧은 예시를 제공하고 선택으로 이끄는지 확인한다.

### 전제 조건

- Memory: profile.md 존재 (interests: [마케팅, 트렌드])

### 입력 / 단계

| 턴 | 사용자 입력 | 기대하는 에이전트 행동 |
|---|---|---|
| 1 | `뭘 만들어야 할지 모르겠어` | 2~4개 예시 제시 (관심사 기반 개인화 가능) |
| 2 | `알림 친구가 좋겠어` | 역할 확정 → 대상 질문 |
| 3~5 | (상세 입력) | 정상 생성 흐름 |

### Pass 기준

- [ ] 예시가 2~4개
- [ ] Memory의 interests 기반 개인화 가능 (마케팅 관련 예시 등)
- [ ] 선택 후 정상 생성 흐름으로 이어짐
- [ ] 구상이 결국 생성으로 이어짐

### Fail 기준

- [ ] 예시 없이 바로 "뭘 만들고 싶으세요?" 재질문
- [ ] 5개 이상 긴 목록
- [ ] 구상만 하고 생성으로 이어지지 않음

### 캡처할 증거

- 예시 목록
- 관심사 기반 개인화 여부

---

## QA-P-13: Memory-First — 기존 선호로 질문 감소

### 목적

Memory에 알림 시간, 말투 선호가 있을 때 해당 정보를 재질문하지 않고 기본값으로 활용하는지 확인한다.

### 전제 조건

- Memory:
  - profile.md: name: 민지, interests: [마케팅]
  - preferences.md: notification_time: morning, tone: friendly

### 입력 / 단계

| 턴 | 사용자 입력 | 기대하는 에이전트 행동 |
|---|---|---|
| 1 | `마케팅 트렌드 봇 만들어줘` | Memory 참고 → 대상만 질문 (시점/말투는 이미 앎) |
| 2 | `주요 마케팅 블로그 3개` | 대상 수용 → 확인 요약 (기존 선호 반영) |
| 3 | `좋아` | 승인 → 생성 |

### Pass 기준

- [ ] 알림 시간을 묻지 않음 (Memory의 morning 사용)
- [ ] 말투를 묻지 않음 (Memory의 friendly 사용)
- [ ] 확인 요약에 기본값 출처 표시 ("기본처럼 아침에 알려드릴게요")
- [ ] 질문 수 1~2개

### Fail 기준

- [ ] Memory에 있는 선호를 재질문
- [ ] 기본값 사용했는데 확인 요약에 미공개

### 캡처할 증거

- Memory에서 읽은 값
- 확인 요약의 기본값 표시 여부
- 총 질문 수

---

## QA-P-14: Confirmation Rejection — 확인 요약 거절 후 수정

### 목적

사용자가 확인 요약을 거절하고 특정 항목을 변경할 때, 해당 항목만 수정하고 나머지를 유지하는지 확인한다.

### 전제 조건

- Memory: profile.md 존재

### 입력 / 단계

| 턴 | 사용자 입력 | 기대하는 에이전트 행동 |
|---|---|---|
| 1 | `뉴스 요약봇 만들어줘` | 질문 → 확인 요약 제시 |
| 2~3 | (상세 입력) | 확인 요약 |
| 4 | `말투를 존댓말로 바꿔줘` | 말투만 변경 → 수정된 확인 요약 재제시 |
| 5 | `좋아` | 승인 → 생성 |

### Pass 기준

- [ ] 거절 항목(말투)만 변경
- [ ] 나머지 항목 유지
- [ ] 수정된 확인 요약 재제시
- [ ] SOUL.md의 formality가 `존댓말`로 반영
- [ ] greetings 배열이 존댓말 어투와 일치

### Fail 기준

- [ ] 전체 요약 리셋
- [ ] 변경하지 않은 항목까지 재질문
- [ ] formality와 greetings 어투 불일치

### 캡처할 증거

- 원래 확인 요약
- 수정 요청 후 재제시된 요약
- SOUL.md의 formality + greetings 내용

---

## QA-P-15: Default Value Disclosure — 기본값 사용 시 공개

### 목적

질문 예산 초과 등으로 기본값을 사용했을 때 확인 요약에서 반드시 공개하는지 확인한다.

### 전제 조건

- Memory: profile.md 존재 (preferences 없음)

### 입력 / 단계

| 턴 | 사용자 입력 | 기대하는 에이전트 행동 |
|---|---|---|
| 1 | `일정 리마인더 봇 만들어줘` | 역할 추출 → 대상 질문 |
| 2 | `구글 캘린더 일정` | 대상 수용 → 확인 요약 (채널/말투/외형은 기본값) |

### 기대 결과

- 채널: 기본값 `현재 플랫폼` → 요약에 명시
- 말투: 기본값 `친근한 기본 말투` → 요약에 명시
- 외형: 기본값 `역할 기반 기본 캐릭터` → 요약에 명시
- "바꾸고 싶으면 말씀해주세요" 같은 정정 기회

### Pass 기준

- [ ] 확인 요약에 기본값 사용 항목이 명시됨
- [ ] 정정 기회 제공 ("바꾸고 싶으면 말씀해주세요")
- [ ] 기본값이 합리적 (말투: 기본, 채널: 현재 플랫폼)

### Fail 기준

- [ ] 기본값 사용했는데 요약에 미표시
- [ ] 정정 기회 없이 바로 생성

### 캡처할 증거

- 확인 요약의 기본값 표시 부분

---

## QA-P-16: Schema Validation — persona.md

### 목적

생성된 persona.md가 `persona.schema.json`을 정확히 충족하는지 필드 단위로 검증한다.

### 전제 조건

- QA-P-01 또는 다른 생성 시나리오 완료 상태

### 검증 항목

| 필드 | 검증 규칙 |
|---|---|
| `frontmatter.type` | `"agent-persona"` 정확히 일치 |
| `frontmatter.agent_id` | 비어 있지 않은 문자열 |
| `frontmatter.created` | `YYYY-MM-DD` 날짜 형식 |
| `content.visual_description` | 비어 있지 않음, 캐릭터 묘사 포함 |
| `content.pixel_art_prompt` | 비어 있지 않음, 영문 프롬프트 형태 |
| `content.color_palette.primary` | `^#[0-9A-Fa-f]{6}$` 패턴 |
| `content.color_palette.secondary` | `^#[0-9A-Fa-f]{6}$` 패턴 |
| `content.color_palette.accent` | `^#[0-9A-Fa-f]{6}$` 패턴 |
| `additionalProperties` | 스키마 밖 필드 없음 |

### Pass 기준

- [ ] 모든 필수 필드 존재
- [ ] 색상 코드가 `#RRGGBB` 패턴
- [ ] visual_description이 도트 캐릭터로 옮길 수 있을 정도로 구체적
- [ ] 스키마 밖 필드 없음

### Fail 기준

- [ ] 필수 필드 누락
- [ ] 색상 코드가 `rgb()`, `#RGB`, 또는 색 이름
- [ ] `additionalProperties` 위반

### 캡처할 증거

- persona.md 전문
- 필드별 값 목록

---

## QA-P-17: Schema Validation — SOUL.md

### 목적

생성된 SOUL.md가 `soul.schema.json`을 정확히 충족하는지 검증한다. 특히 `greetings_alert`, `greetings_approach` 키 이름과 배열 형식에 주목한다.

### 전제 조건

- 생성 시나리오 완료 상태

### 검증 항목

| 필드 | 검증 규칙 |
|---|---|
| `frontmatter.type` | `"agent-soul"` |
| `frontmatter.agent_id` | persona.md와 동일 |
| `frontmatter.model` | 비어 있지 않음 |
| `content.identity` | 비어 있지 않음 |
| `content.personality.tone` | 배열, 1개 이상 항목 |
| `content.personality.verbosity` | 비어 있지 않음 |
| `content.personality.emoji_usage` | 비어 있지 않음 |
| `content.personality.language` | `Korean`/`English`/`Japanese`/`Chinese`/`mixed` |
| `content.personality.formality` | `존댓말` 또는 `반말` |
| `content.greetings_alert` | **배열** (문자열 아님), 1개 이상 |
| `content.greetings_approach` | **배열** (문자열 아님), 1개 이상 |
| `content.behavior_rules` | 배열, 1개 이상 |
| `content.boundaries` | 배열, 1개 이상 |
| 키 이름 정확성 | `greetings_alert` / `greetings_approach` 정확히 (다른 이름 금지) |
| formality-greeting 일치 | formality가 `반말`이면 greetings도 반말 어투 |

### Pass 기준

- [ ] greetings_alert가 배열이고 1개 이상 항목
- [ ] greetings_approach가 배열이고 1개 이상 항목
- [ ] 키 이름이 정확히 `greetings_alert`, `greetings_approach`
- [ ] formality 값과 greeting 어투가 일치
- [ ] personality.language가 enum 범위 내

### Fail 기준

- [ ] greetings가 문자열로 되어 있음
- [ ] 다른 키 이름 사용 (예: `greeting_alert`, `alert_greetings`)
- [ ] formality `반말`인데 greetings가 존댓말

### 캡처할 증거

- SOUL.md 전문
- greetings_alert / greetings_approach 배열 내용
- formality 값

---

## QA-P-18: Schema Validation — config.md

### 목적

생성된 config.md가 `config.schema.json`을 정확히 충족하는지 검증한다.

### 전제 조건

- 생성 시나리오 완료 상태

### 검증 항목

| 필드 | 검증 규칙 |
|---|---|
| `frontmatter.type` | `"agent-config"` |
| `frontmatter.agent_id` | 다른 2파일과 동일 |
| `content.skills` | 배열, 1개 이상 |
| `content.skills[].name` | 비어 있지 않음 |
| `content.skills[].enabled` | boolean 값 |
| `content.skills[].purpose` | 비어 있지 않음 |
| `content.skills[].triggers` | 배열, 1개 이상 |
| `content.schedule.type` | `"cron"` 고정 |
| `content.schedule.expression` | 비어 있지 않음 |
| `content.schedule.action` | 비어 있지 않음 |
| `content.channels.primary` | 비어 있지 않음 |
| `content.channels.fallback` | 비어 있지 않음 |
| `content.memory.user_context` | `../profile.md` 기준 |
| `content.memory.agent_memory` | 비어 있지 않음 |
| 도구 하드코딩 없음 | skills[].name이 `insane-search`만 고정되지 않음 (역할에 맞는 도구) |

### Pass 기준

- [ ] schedule.type이 `"cron"` 고정
- [ ] skills 배열이 1개 이상, 각 항목에 name/enabled/purpose/triggers 존재
- [ ] memory.user_context가 `../profile.md`
- [ ] 도구가 역할에 맞게 동적 매칭
- [ ] agent_id가 3종 파일 일치

### Fail 기준

- [ ] schedule.type이 `"cron"` 외 다른 값
- [ ] skills 배열이 비어 있음
- [ ] memory.user_context가 `../Memory.md` (레거시)
- [ ] 도구가 무조건 `insane-search` 하드코딩

### 캡처할 증거

- config.md 전문
- skills 배열
- memory.user_context 값

---

## QA-P-19: Max 3 Agents — 에이전트 수 제한

### 목적

사용자가 이미 3개 에이전트를 보유할 때, 추가 생성 요청에 대해 제한을 알리는지 확인한다.

### 전제 조건

- Memory: profile.md 존재
- agents/index.md: 에이전트 3개 존재

### 입력 / 단계

| 턴 | 사용자 입력 | 기대하는 에이전트 행동 |
|---|---|---|
| 1 | `새로 날씨봇 하나 만들어줘` | 에이전트 수 확인 → 3개 제한 안내 |

### 기대 결과

- 4번째 에이전트 생성 불가 안내
- 기존 에이전트 삭제 또는 수정 제안
- 강제 생성하지 않음

### Pass 기준

- [ ] 3개 제한을 인식하고 사용자에게 안내
- [ ] 대안 제시 (삭제 후 생성, 기존 수정)
- [ ] 4번째 에이전트를 그냥 만들지 않음

### Fail 기준

- [ ] 제한 무시하고 4번째 생성
- [ ] 제한 안내 없이 거절만

### 캡처할 증거

- 제한 안내 메시지
- agents/index.md 기존 목록

---

## QA-P-20: English/Korean Mixed Input — 혼합 언어 입력

### 목적

영한 혼합 입력을 정상적으로 파싱하고 에이전트 정의에 반영하는지 확인한다.

### 전제 조건

- Memory: profile.md 존재

### 입력 / 단계

| 턴 | 사용자 입력 | 기대하는 에이전트 행동 |
|---|---|---|
| 1 | `competitor blog monitoring bot 하나 만들어줘. daily로 check해줬으면.` | 영한 혼합 파싱 → 역할/시점 추출 → 대상 질문 |
| 2 | `TechCrunch, VentureBeat` | 대상 수용 → 확인 요약 |
| 3 | `OK` | 승인 → 생성 |

### Pass 기준

- [ ] 영한 혼합 입력에서 역할(`blog monitoring`)과 시점(`daily`)을 정확히 추출
- [ ] 사용자-facing 응답은 한국어 (기술 용어를 쉬운 말로 변환)
- [ ] 생성 결과물의 language는 사용자 설정에 따름

### Fail 기준

- [ ] 영어 부분을 무시
- [ ] 기술 용어를 그대로 사용자에게 노출 ("cron", "trigger" 등)

### 캡처할 증거

- 혼합 입력 파싱 결과
- 사용자-facing 응답 언어

---

## QA-P-21: One Question Per Turn — 한 턴에 한 질문

### 목적

모든 상호작용에서 한 턴에 질문을 1개만 하는 원칙이 지켜지는지 확인한다.

### 전제 조건

- Memory: profile.md 존재 (preferences 없음, 빠진 정보 다수)

### 입력 / 단계

| 턴 | 사용자 입력 | 기대하는 에이전트 행동 |
|---|---|---|
| 1 | `뉴스봇 만들어줘` | 대상 질문 **하나만** |
| 2 | `IT 뉴스` | 시점 질문 **하나만** |
| 3 | `아침에` | 채널 질문 **하나만** (또는 확인 요약) |
| 4 | `여기서` | 확인 요약 |
| 5 | `좋아` | 생성 |

### 검증 방법

모든 에이전트 응답에서 `?`의 개수를 세거나, 질문 문장을 추출하여 턴당 1개인지 확인한다.

### Pass 기준

- [ ] 모든 턴에서 질문이 1개
- [ ] "대상이랑 시점이랑 채널을 알려주세요" 같은 복합 질문 없음
- [ ] 필수 정보를 우선순위대로 순차 질문 (대상 → 시점 → 채널)

### Fail 기준

- [ ] 한 턴에 2개 이상 질문 존재
- [ ] 질문 우선순위가 뒤바뀜 (채널을 대상보다 먼저 질문)

### 캡처할 증거

- 각 턴의 에이전트 응답에서 질문 문장 목록
- 턴당 질문 수

---

## 시나리오 요약 매트릭스

| ID | 시나리오 | 유형 | 핵심 검증 포인트 |
|---|---|---|---|
| QA-P-01 | Clear Request (Happy Path) | 정상 경로 | Memory 활용, 확인 요약, 3종 생성 |
| QA-P-02 | Complaint Input | 입력 유형 | 짧은 공감, 생성 유도 |
| QA-P-03 | Vague Request | 입력 유형 | 탐색 질문, 역할 끌어내기 |
| QA-P-04 | Example Reference | 입력 유형 | 역추적 질문, 역할 파악 |
| QA-P-05 | Compound — Split | 복합 경로 | 분리 선택, 순차 생성 |
| QA-P-06 | Compound — Merge | 복합 경로 | 합치기, skills 배열 복수 |
| QA-P-07 | Out-of-Scope (날씨) | 경계 테스트 | 거절 + 생성 유도 |
| QA-P-08 | Out-of-Scope (감정) | 경계 테스트 | 과한 공감 없음 |
| QA-P-09 | Out-of-Scope (검색) | 경계 테스트 | 직접 답변 없음 |
| QA-P-10 | Agent Modification | 수정 경로 | 부분 수정, 나머지 유지 |
| QA-P-11 | Agent Deletion | 삭제 경로 | 확인 후 삭제 |
| QA-P-12 | Ideation | 구상 경로 | 예시 제시, 생성 연결 |
| QA-P-13 | Memory-First | 최적화 경로 | 재질문 방지, 기본값 활용 |
| QA-P-14 | Confirmation Rejection | 수정 경로 | 부분 변경, 요약 재제시 |
| QA-P-15 | Default Value Disclosure | 출력 계약 | 기본값 공개, 정정 기회 |
| QA-P-16 | Schema — persona.md | 스키마 검증 | 색상 패턴, 필수 필드 |
| QA-P-17 | Schema — SOUL.md | 스키마 검증 | greetings 배열, formality |
| QA-P-18 | Schema — config.md | 스키마 검증 | cron, skills, memory 링크 |
| QA-P-19 | Max 3 Agents | 엣지 케이스 | 3개 제한 인식 |
| QA-P-20 | English/Korean Mixed | 엣지 케이스 | 혼합 파싱, 한국어 응답 |
| QA-P-21 | One Question Per Turn | 동작 규칙 | 턴당 1질문 검증 |
