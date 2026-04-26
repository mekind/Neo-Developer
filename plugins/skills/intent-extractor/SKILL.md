---
name: intent-extractor
description: >
  Extracts structured intent from messy natural-language user input for Persona Builder.
  Classifies input type, identifies role/tool fit, flags missing required fields,
  and proposes short clarification questions in plain Korean.
  Handles: 명확한 요청, 불만/문제 토로형, 모호한 요청, 예시 언급형, 복합 요청.
---

# Intent Extractor

> 사용자의 자연어 입력을 구조화된 의도(intent) 필드와 도구/스킬 매칭으로 변환한다.

## Mission

Persona Builder가 받는 사용자 입력은 포맷이 없다.
이 스킬은 비정형 한국어 입력을 분석하여:

1. **에이전트 정의 요청인지 판별**한다 (scope gate).
2. 의도를 구조화된 필드로 추출한다.
3. 적합한 도구/스킬을 후보로 매칭한다.
4. 빠진 필수 정보를 식별하고, 비개발자도 이해할 수 있는 짧은 질문을 제안한다.

이 스킬은 **지시서(instruction)**이다. NLP 코드나 파서 구현이 아니다.

---

## Input Categories

사용자 입력을 다섯 가지 유형으로 분류한다. 분류 결과는 처리 전략을 결정한다.

| # | 유형 | 특징 | 처리 전략 |
|---|------|------|----------|
| 1 | **명확한 요청** | 역할·대상이 직접 명시됨 | 바로 역할 추출 → 확인 후 생성 |
| 2 | **불만/문제 토로형** | 감정 표현 + 반복 행동 언급 | 공감 → 해결책 제안 → 에이전트로 연결 |
| 3 | **모호한 요청** | 구체적 대상/역할 없음 | 탐색 질문으로 구체화 |
| 4 | **예시 언급형** | 타인 경험 참조 | "어떤 거였어요?" 역추적 |
| 5 | **복합 요청** | 두 개 이상 역할이 섞임 | 분리 → 하나씩 확인 |

### Classification Rules

```
IF 입력에 구체적 역할어 + 대상이 있다 → 명확한 요청
ELIF 감정 표현(귀찮아, 힘들어, 짜증 등) + 반복 행동 → 불만/문제 토로형
ELIF "뭔가", "있으면 좋겠어", "도움되는 거" 등 비구체적 → 모호한 요청
ELIF "친구가 쓰는 거", "어디서 봤는데", "그런 거" 등 참조 → 예시 언급형
ELIF 접속사(~도, ~랑, ~하고)로 다수 역할 연결 → 복합 요청
ELSE → 모호한 요청으로 기본 처리
```

---

## Extraction Targets

모든 입력에서 아래 필드를 추출 시도한다. 추출 불가능한 필드는 `null`로 두고 `missing_fields`에 등록한다.

| 필드 | 필수/선택 | 설명 | 예시 |
|------|----------|------|------|
| `input_type` | 필수 | 위 5가지 중 하나 | `"complaint"` |
| `is_agent_request` | 필수 | 에이전트 정의 요청 여부 | `true` |
| `role` | 필수 | 에이전트가 수행할 역할 요약 | `"정보 수집 + 알림"` |
| `target` | 필수 | 무엇을 볼지/할지 | `"경쟁사 블로그 새 글"` |
| `schedule_or_trigger` | 필수 | 언제 실행/알림할지 | `"매일 아침"` / `"새 글 감지 시"` |
| `delivery_channel` | 필수 | 어디로 전달할지 | `"Discord"` / `"여기서 직접"` |
| `tone` | 선택 | 말투/성격 | `"친근하게"` / `"깔끔하게"` |
| `formality` | 선택 | 존댓말/반말 | `"반말"` |
| `visual_appearance` | 선택 | 외형 설명 | `"파란 모자 쓴 고양이"` |
| `candidate_tools` | 추출 | 매칭된 도구/스킬 목록 | `["insane-search"]` |
| `missing_fields` | 자동 | 빠진 필수 필드 이름 목록 | `["target", "schedule_or_trigger"]` |
| `confidence` | 자동 | 추출 확신도 | `"high"` |
| `next_question` | 자동 | 다음에 물어볼 질문 | `"어떤 블로그요?"` |

---

## Tool Matching Rules

역할이 추출되면 사용 가능한 도구/스킬 목록에서 후보를 매칭한다.
도구 목록은 **설정(config)에서 제공**되며 하드코딩하지 않는다.

### Matching Process

```
1. 역할 키워드 추출: role에서 핵심 동사/명사 분리
   예: "경쟁사 블로그 새 글 알림" → [정보수집, 웹크롤링, 알림, 블로그]

2. 도구 설명(description)과 키워드 매칭:
   - 의미적 연관성 기준 (정확한 문자열 매칭이 아님)
   - 역할 키워드가 도구 description의 capability와 겹치면 후보로 등록

3. 복수 매칭 시 relevance 순 정렬, 최대 3개 후보 반환

4. 매칭 없으면 candidate_tools = [] + confidence 하향
```

### Known Tool Examples

아래는 알려진 도구 예시이며, 실제 매칭 시에는 런타임에 제공되는 도구 목록을 사용한다.

| 역할 패턴 | 후보 도구 | 매칭 근거 |
|----------|----------|----------|
| 웹 크롤링, 블로그 모니터링, 뉴스 수집 | `insane-search` | 웹사이트 접근·크롤링·모니터링 |
| 일정 알림, 리마인더 | 캘린더 연동 도구 | 시간 기반 트리거 |
| 대화 상대, 잡담 친구 | 대화 스킬 | 자유 대화 처리 |
| 고객 응대, FAQ | 지식베이스 검색 도구 | 정보 조회 + 응답 생성 |
| YouTube/미디어 모니터링 | `insane-search` | 미디어 사이트 접근 (yt-dlp 포함) |

---

## Missing Information Rules

### Principles

1. **절대 추측하지 않는다**: 필수 필드가 빠지면 `missing_fields`에 등록하고 `next_question`을 생성한다.
2. **한 번에 하나만 묻는다**: 가장 중요한 빠진 필드부터 질문한다.
3. **기술 용어를 피한다**: "cron 주기"가 아니라 "언제 알려드릴까요?"로 질문한다.
4. **기본값을 제안한다**: 선택 필드는 "기본으로 할까요?"라고 제안할 수 있다.

### Question Priority Order

빠진 필드가 여러 개일 때 아래 순서로 질문한다:

```
1. target (뭘 볼지/할지) — 역할의 핵심이므로 최우선
2. schedule_or_trigger (언제) — 기본값 "매일 아침" 제안 가능
3. delivery_channel (어디로) — 기본값 "여기서 직접" 제안 가능
4. tone (선택) — "기본으로 할까요?" 제안
5. visual_appearance (선택) — "기본으로 할까요?" 제안
```

### Question Style

```
# 비개발자 친화적 질문 스타일
BAD:  "target 파라미터를 입력해주세요"
GOOD: "어떤 블로그를 확인해드릴까요?"

BAD:  "delivery_channel을 선택하세요: discord | slack | direct"
GOOD: "어디로 알려드릴까요? 디스코드? 슬랙? 아니면 여기서 직접?"

BAD:  "cron expression을 설정해주세요"
GOOD: "언제 알려드릴까요? 매일 아침? 새 글 나오면 바로?"
```

---

## Compound Request Handling

복합 요청은 여러 역할이 하나의 입력에 섞인 경우이다.

### Detection

```
신호어: ~도, ~랑, ~하고, 그리고, 또, 블로그도 보고 유튜브도
접속사로 연결된 서로 다른 대상/역할이 2개 이상이면 복합 요청
```

### Processing

```
1. 개별 역할로 분리
2. 사용자에게 선택지 제시:
   - 따로 만들기 (각각 독립 에이전트)
   - 합쳐서 만들기 (하나의 멀티 역할 에이전트)
3. 선택 후 각 역할에 대해 동일한 추출 흐름 적용
```

### Example

```
입력: "블로그도 보고 유튜브 새 영상도 알려주고 그랬으면 좋겠어"

분리 결과:
  sub_intent_1: { role: "블로그 모니터링", target: null }
  sub_intent_2: { role: "유튜브 신규 영상 알림", target: null }

응답: "두 가지네요! 하나씩 만들까요, 아니면 합쳐서 하나로?
       1️⃣ 따로: 블로그봇 + 유튜브봇
       2️⃣ 합쳐서: 콘텐츠봇 (둘 다 알려줌)
       어떤 게 좋아요?"
```

---

## Scope Gate

모든 입력은 먼저 scope gate를 통과해야 한다.

```
IF 입력이 에이전트 정의/생성/수정 요청이다
  → is_agent_request = true → 추출 진행
ELIF 입력이 일반 대화/조언/감정 지원/무관한 질문이다
  → is_agent_request = false
  → 거절 + 리다이렉트:
    "저는 에이전트 만드는 걸 도와드려요!
     혹시 ~을 대신 해줄 친구를 만들어볼까요?"
```

### Edge Cases

- "심심해" → `is_agent_request = false`. 하지만 리다이렉트 시 "대화 친구 에이전트 만들어볼까요?" 제안 가능.
- "고마워" / 인사 → scope 외지만 짧은 응답 후 에이전트 생성으로 유도.
- "이 에이전트 삭제해줘" → 에이전트 관리 요청이므로 `is_agent_request = true`.

---

## Confidence Levels

추출 결과의 확신도를 세 단계로 표시한다.

| Level | 조건 | 후속 행동 |
|-------|------|----------|
| `high` | role + target + schedule 모두 추출됨, 도구 매칭 성공 | 확인 질문 후 바로 생성 |
| `medium` | role은 추출되었으나 target 또는 schedule 누락 | 빠진 필드 1-2개 질문 |
| `low` | role 자체가 불명확하거나 모호한 요청 | 탐색 질문으로 구체화 필요 |

---

## Structured Output Shape

추출 결과는 아래 JSON 구조를 따른다.

```json
{
  "input_type": "clear | complaint | vague | reference | compound",
  "is_agent_request": true,
  "role": "정보 수집 + 알림",
  "target": "경쟁사 블로그 새 글",
  "schedule_or_trigger": "매일 아침",
  "delivery_channel": null,
  "tone": null,
  "formality": null,
  "visual_appearance": null,
  "candidate_tools": ["insane-search"],
  "missing_fields": ["delivery_channel"],
  "confidence": "high",
  "next_question": "어디로 알려드릴까요? 디스코드? 슬랙? 아니면 여기서 직접?",
  "sub_intents": null
}
```

### `input_type` Enum

| 값 | 한국어 유형 |
|----|-----------|
| `clear` | 명확한 요청 |
| `complaint` | 불만/문제 토로형 |
| `vague` | 모호한 요청 |
| `reference` | 예시 언급형 |
| `compound` | 복합 요청 |

### `sub_intents` (compound only)

복합 요청인 경우에만 채워진다. 각 하위 의도는 동일한 구조의 축소판이다:

```json
{
  "sub_intents": [
    { "role": "블로그 모니터링", "target": null, "candidate_tools": ["insane-search"] },
    { "role": "유튜브 신규 영상 알림", "target": null, "candidate_tools": ["insane-search"] }
  ]
}
```

---

## Few-shot Examples

### Example 1: 명확한 요청 (Clear)

**입력**: `"경쟁사 블로그 알림 봇 만들어줘"`

```json
{
  "input_type": "clear",
  "is_agent_request": true,
  "role": "경쟁사 블로그 모니터링 + 알림",
  "target": "경쟁사 블로그",
  "schedule_or_trigger": null,
  "delivery_channel": null,
  "tone": null,
  "formality": null,
  "visual_appearance": null,
  "candidate_tools": ["insane-search"],
  "missing_fields": ["schedule_or_trigger", "delivery_channel"],
  "confidence": "medium",
  "next_question": "언제 알려드릴까요? 매일 아침? 새 글 올라오면 바로?",
  "sub_intents": null
}
```

### Example 2: 불만/문제 토로형 (Complaint)

**입력**: `"아 맨날 블로그 확인하는 거 존나 귀찮아"`

```json
{
  "input_type": "complaint",
  "is_agent_request": true,
  "role": "정보 수집 + 알림",
  "target": null,
  "schedule_or_trigger": "매일",
  "delivery_channel": null,
  "tone": null,
  "formality": "반말",
  "visual_appearance": null,
  "candidate_tools": ["insane-search"],
  "missing_fields": ["target"],
  "confidence": "medium",
  "next_question": "어떤 블로그를 확인하세요? 제가 대신 봐드릴까요?",
  "sub_intents": null
}
```

### Example 3: 모호한 요청 (Vague)

**입력**: `"뭔가 도움되는 거 있으면 좋겠는데"`

```json
{
  "input_type": "vague",
  "is_agent_request": true,
  "role": null,
  "target": null,
  "schedule_or_trigger": null,
  "delivery_channel": null,
  "tone": null,
  "formality": null,
  "visual_appearance": null,
  "candidate_tools": [],
  "missing_fields": ["role", "target", "schedule_or_trigger", "delivery_channel"],
  "confidence": "low",
  "next_question": "요즘 반복적으로 하는 일 중에 귀찮은 거 있어요?",
  "sub_intents": null
}
```

### Example 4: 예시 언급형 (Reference)

**입력**: `"친구가 매일 아침 뉴스 요약해주는 봇 쓰는데 그런 거 나도 갖고 싶어"`

```json
{
  "input_type": "reference",
  "is_agent_request": true,
  "role": "뉴스 요약 + 알림",
  "target": "뉴스",
  "schedule_or_trigger": "매일 아침",
  "delivery_channel": null,
  "tone": null,
  "formality": null,
  "visual_appearance": null,
  "candidate_tools": ["insane-search"],
  "missing_fields": ["delivery_channel"],
  "confidence": "high",
  "next_question": "어디로 알려드릴까요? 디스코드? 슬랙? 아니면 여기서 직접?",
  "sub_intents": null
}
```

### Example 5: 복합 요청 (Compound)

**입력**: `"블로그도 보고 유튜브 새 영상도 알려주고 그랬으면 좋겠어"`

```json
{
  "input_type": "compound",
  "is_agent_request": true,
  "role": "콘텐츠 모니터링 (복합)",
  "target": null,
  "schedule_or_trigger": null,
  "delivery_channel": null,
  "tone": null,
  "formality": null,
  "visual_appearance": null,
  "candidate_tools": ["insane-search"],
  "missing_fields": ["target", "schedule_or_trigger", "delivery_channel"],
  "confidence": "medium",
  "next_question": "두 가지네요! 하나씩 만들까요, 아니면 합쳐서 하나로?",
  "sub_intents": [
    { "role": "블로그 모니터링", "target": null, "candidate_tools": ["insane-search"] },
    { "role": "유튜브 신규 영상 알림", "target": null, "candidate_tools": ["insane-search"] }
  ]
}
```

### Example 6: 리마인더 요청 (Clear - non-web)

**입력**: `"매일 저녁 8시에 물 마시라고 알려줘"`

```json
{
  "input_type": "clear",
  "is_agent_request": true,
  "role": "리마인더",
  "target": "물 마시기",
  "schedule_or_trigger": "매일 저녁 8시",
  "delivery_channel": null,
  "tone": null,
  "formality": null,
  "visual_appearance": null,
  "candidate_tools": [],
  "missing_fields": ["delivery_channel"],
  "confidence": "high",
  "next_question": "어디로 알려드릴까요?",
  "sub_intents": null
}
```

### Example 7: Scope 외 요청 (Rejection)

**입력**: `"오늘 날씨 어때?"`

```json
{
  "input_type": "clear",
  "is_agent_request": false,
  "role": null,
  "target": null,
  "schedule_or_trigger": null,
  "delivery_channel": null,
  "tone": null,
  "formality": null,
  "visual_appearance": null,
  "candidate_tools": [],
  "missing_fields": [],
  "confidence": "high",
  "next_question": "저는 에이전트 만드는 걸 도와드려요! 혹시 날씨를 매일 알려줄 친구를 만들어볼까요?",
  "sub_intents": null
}
```

### Example 8: 고객 응대 에이전트 (Clear - customer support)

**입력**: `"우리 쇼핑몰 고객 문의 대신 답변해주는 봇 만들어줘"`

```json
{
  "input_type": "clear",
  "is_agent_request": true,
  "role": "고객 문의 응대",
  "target": "쇼핑몰 고객 문의",
  "schedule_or_trigger": "문의 접수 시 즉시",
  "delivery_channel": null,
  "tone": null,
  "formality": "존댓말",
  "visual_appearance": null,
  "candidate_tools": [],
  "missing_fields": ["delivery_channel"],
  "confidence": "high",
  "next_question": "어디서 들어오는 문의를 처리할까요? 디스코드? 웹 채팅?",
  "sub_intents": null
}
```

---

## Anti-Patterns

이 스킬이 **하지 말아야 할 것**:

| # | Anti-Pattern | 올바른 처리 |
|---|-------------|------------|
| 1 | 빠진 필드를 임의로 채움 | `missing_fields`에 등록하고 `next_question` 생성 |
| 2 | 기술 용어로 질문 | 비개발자도 이해할 수 있는 일상어 사용 |
| 3 | 한 번에 여러 질문 | 가장 중요한 빠진 필드 하나만 먼저 질문 |
| 4 | 도구 목록 하드코딩 | 런타임 도구 목록에서 동적 매칭 |
| 5 | 일반 대화에 응답 | scope gate로 거절 + 에이전트 생성으로 리다이렉트 |
| 6 | 웹/뉴스 에이전트에만 최적화 | 리마인더, 고객 응대, 대화 친구 등 다양한 유형 지원 |
| 7 | 복합 요청을 단일로 강제 | 분리 후 사용자에게 합칠지/나눌지 선택권 부여 |
| 8 | 역할 추출 없이 도구부터 매칭 | 반드시 역할 추출 → 도구 매칭 순서 |

---

## Review Checklist

Intent Extractor의 출력을 검증할 때 아래를 확인한다.

- [ ] `is_agent_request`가 정확히 판별되었는가?
- [ ] `input_type`이 5가지 유형 중 하나로 분류되었는가?
- [ ] 필수 필드(`role`, `target`, `schedule_or_trigger`, `delivery_channel`) 중 빠진 것이 `missing_fields`에 모두 등록되었는가?
- [ ] `next_question`이 비개발자도 이해할 수 있는 일상어인가?
- [ ] `next_question`이 하나의 질문만 포함하는가? (복수 질문 금지)
- [ ] `candidate_tools`가 하드코딩이 아니라 역할 기반 매칭인가?
- [ ] `confidence` 레벨이 실제 추출 완성도와 일치하는가?
- [ ] 복합 요청 시 `sub_intents`로 올바르게 분리되었는가?
- [ ] scope 외 요청이 거절 + 에이전트 생성 리다이렉트로 처리되었는가?
- [ ] 감정이 포함된 입력에서 공감 요소가 `next_question`에 반영되었는가?
