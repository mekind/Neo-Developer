# MyClaw Agent & Skill 등록 가이드

> 비개발자가 대화만으로 AI 에이전트를 만드는 MyClaw의 Agent/Skill 설정 가이드

---

## 📁 파일 구조 요약

```
Neo-Developer/
├── agents/                      # Agent 정의 파일
│   ├── onboarding.md           # 온보딩 Agent
│   └── persona-builder.md      # 에이전트 생성 Agent
│
├── skills/                      # Skill 정의 파일
│   ├── memory-manager/         # Memory 파일 관리
│   ├── intent-extractor/       # 의도 추출
│   ├── clarify-interview/      # 인터뷰 흐름
│   └── output-schemas/         # JSON 스키마 4종
│
└── docs/
    ├── qa-scenarios/           # QA 테스트 시나리오
    └── SETUP-GUIDE.md          # 이 문서
```

---

## 🚀 빠른 시작

### 1단계: Agent를 Claude에 등록하기

**방법 A: Claude CLI로 테스트**

```bash
# 온보딩 Agent 테스트
claude --system-prompt "$(cat agents/onboarding.md)"

# Persona Builder 테스트
claude --system-prompt "$(cat agents/persona-builder.md)"
```

**방법 B: Claude Desktop에서 테스트**

1. `agents/onboarding.md` 또는 `agents/persona-builder.md` 파일 내용 복사
2. Claude Desktop 새 대화 시작
3. 첫 메시지에 붙여넣기:
   ```
   아래는 너의 System Prompt야. 이 지시를 따라 행동해.
   
   ---
   [Agent.md 내용 붙여넣기]
   ---
   
   (세션 시작)
   ```

**방법 C: API로 연동 (실제 서버)**

```javascript
const response = await anthropic.messages.create({
  model: "claude-sonnet-4-5-20250514",
  system: fs.readFileSync("agents/persona-builder.md", "utf-8"),
  messages: [{ role: "user", content: userInput }],
});
```

---

## 📋 복사용 파일 경로

### Agent 파일 (System Prompt로 사용)

| Agent | 파일 경로 | 용도 |
|-------|----------|------|
| 온보딩 | `agents/onboarding.md` | 신규 사용자 정보 수집 |
| Persona Builder | `agents/persona-builder.md` | 에이전트 생성/수정/삭제 |

### Skill 파일 (Agent가 참조)

| Skill | 파일 경로 | 용도 |
|-------|----------|------|
| Memory Manager | `skills/memory-manager/SKILL.md` | 파일 저장/읽기 규칙 |
| Intent Extractor | `skills/intent-extractor/SKILL.md` | 자연어 → 구조화 |
| Clarify Interview | `skills/clarify-interview/SKILL.md` | 질문 흐름 |

### Output 스키마 (출력 검증용)

| 스키마 | 파일 경로 | 대상 파일 |
|--------|----------|----------|
| Profile | `skills/output-schemas/profile.schema.json` | `profile.md` |
| Persona | `skills/output-schemas/persona.schema.json` | `persona.md` |
| Soul | `skills/output-schemas/soul.schema.json` | `SOUL.md` |
| Config | `skills/output-schemas/config.schema.json` | `config.md` |

---

## 🧪 테스트 방법

### 온보딩 테스트 (5분)

1. `agents/onboarding.md`를 System Prompt로 설정
2. 아래 순서로 대화:

```
사용자: (세션 시작)
Agent: 안녕하세요! 이름이 뭐예요?
사용자: 민지
Agent: 반가워요 민지님! 여기 오신 이유가 있으세요?
사용자: 정보 수집하려고요
Agent: 관심 있는 분야가 있으세요? (넘어가도 괜찮아요)
사용자: IT, 스타트업
Agent: 좋아요! 이제 에이전트 친구를 만들어볼까요?
```

**체크포인트:**
- [ ] 한 턴에 질문 1개만
- [ ] 기술 수준 직접 안 물어봄
- [ ] 완료 후 전환 안내

### Persona Builder 테스트 (5분)

1. `agents/persona-builder.md`를 System Prompt로 설정
2. 아래 순서로 대화:

```
사용자: 경쟁사 블로그 알림 봇 만들어줘
Agent: 좋아요! 어떤 블로그를 보면 될지 알려주세요.
사용자: A사, B사 블로그
Agent: 언제 알려드릴까요?
사용자: 매일 아침
Agent: 정리해볼게요.
      - 이름: 블로그봇
      - 하는 일: 경쟁사 블로그 확인
      - 대상: A사, B사 블로그
      - 알려주는 때: 매일 아침
      - 말투: 친근한 반말
      - 모습: (인간형 캐릭터)
      이대로 만들까요?
사용자: 응
Agent: [persona.md, SOUL.md, config.md 생성]
```

**체크포인트:**
- [ ] 확인 요약 제시
- [ ] 승인 후 3종 파일 생성
- [ ] 캐릭터가 인간형 (동물/로봇 X)

---

## ⚠️ 주의사항

### 인간형 캐릭터만 허용

`persona.md`의 Visual Description은 **인간형 캐릭터만** 가능합니다.

```
✅ 허용: 파란 베레모를 쓴 청년, 주황색 후드를 입은 소녀
❌ 금지: 부엉이, 토끼, 로봇, 구름
```

사용자가 동물/로봇을 요청하면 인간형으로 대체 제안합니다.

### 한 턴에 한 질문

Agent는 한 번에 질문을 하나만 합니다.

```
❌ 잘못: "어떤 블로그를 볼까요? 그리고 언제 알려드릴까요?"
✅ 올바름: "어떤 블로그를 볼까요?" → (답변 후) → "언제 알려드릴까요?"
```

### 범위 밖 요청 거절

Agent는 본연의 역할 외 요청을 거절합니다.

```
사용자: 오늘 날씨 어때?
Agent: 저는 에이전트 만드는 걸 도와드려요. 
       날씨 알려주는 친구를 만들어볼까요?
```

---

## 📝 QA 시나리오 문서

상세한 테스트 케이스는 아래 문서 참고:

- `docs/qa-scenarios/onboarding-qa.md` — 온보딩 9개 시나리오
- `docs/qa-scenarios/persona-builder-qa.md` — Persona Builder 21개 시나리오

---

## 🔧 서버 연동 시 참고

### 세션 제어 아키텍처

```
[서버 (OpenClaw)]
  ↓ System Prompt로 Agent.md 주입
[Claude]
  ↓ 구조화된 출력 산출
[서버]
  ↓ MCP Tool로 파일 저장
[~/.myclaw/users/{user_id}/]
```

### Memory 저장 경로

```
~/.myclaw/users/{user_id}/
├── profile.md              # 사용자 프로필
├── preferences.md          # 선호 설정
├── agents/
│   └── {agent_id}/
│       ├── persona.md      # 외형
│       ├── SOUL.md         # 성격
│       └── config.md       # 설정
└── context/
    └── interests.md        # 관심사
```

### 상세 아키텍처

`agents/README.md` 참고 — 서버 vs Agent 책임 경계, 세션 전환 흐름 등

---

## 📞 문의

이슈가 있으면 GitHub Issue로 남겨주세요.
