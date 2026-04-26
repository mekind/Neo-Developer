# MyClaw Plugins

> Agent와 Skill을 한 곳에 모아둔 플러그인 패키지

---

## 📁 구조

```
plugins/
├── agents/                     # Agent 정의 (System Prompt로 사용)
│   ├── onboarding.md          # 온보딩 Agent
│   └── persona-builder.md     # 에이전트 생성 Agent
│
├── skills/                     # Skill 정의 (Agent가 참조)
│   ├── memory-manager/        # Memory 파일 관리
│   ├── intent-extractor/      # 의도 추출
│   └── clarify-interview/     # 인터뷰 흐름
│
├── schemas/                    # Output 스키마
│   ├── profile.schema.json
│   ├── persona.schema.json
│   ├── soul.schema.json
│   └── config.schema.json
│
└── README.md                   # 이 문서
```

---

## 🚀 등록 방법

### Claude CLI

```bash
# 온보딩 Agent
claude --system-prompt "$(cat plugins/agents/onboarding.md)"

# Persona Builder
claude --system-prompt "$(cat plugins/agents/persona-builder.md)"
```

### Claude Desktop

1. `plugins/agents/onboarding.md` 내용 복사
2. 새 대화에서 System Prompt로 붙여넣기

### API 연동

```javascript
const systemPrompt = fs.readFileSync("plugins/agents/persona-builder.md", "utf-8");

const response = await anthropic.messages.create({
  model: "claude-sonnet-4-5-20250514",
  system: systemPrompt,
  messages: [{ role: "user", content: userInput }],
});
```

---

## 📋 파일 설명

### Agents

| 파일 | 용도 | 복사 경로 |
|------|------|----------|
| `agents/onboarding.md` | 신규 사용자 정보 수집 (이름, 목적, 관심사) | System Prompt |
| `agents/persona-builder.md` | 에이전트 생성/수정/삭제 | System Prompt |

### Skills

| 폴더 | 용도 | Agent가 참조 |
|------|------|-------------|
| `skills/memory-manager/` | Memory 파일 저장/읽기 규칙 | 온보딩, Persona Builder |
| `skills/intent-extractor/` | 자연어 → 구조화된 의도 | Persona Builder |
| `skills/clarify-interview/` | 최소 질문 인터뷰 흐름 | 온보딩, Persona Builder |

### Schemas

| 파일 | 대상 | 검증 내용 |
|------|------|----------|
| `profile.schema.json` | `profile.md` | 사용자 프로필 |
| `persona.schema.json` | `persona.md` | 에이전트 외형 |
| `soul.schema.json` | `SOUL.md` | 에이전트 성격 |
| `config.schema.json` | `config.md` | 에이전트 설정 |

---

## 🧪 빠른 테스트

### 온보딩 (2분)

```
Agent: 안녕! 이름이 뭐예요?
너: 민지
Agent: 여기 오신 이유가 있어요?
너: 정보 수집
Agent: 관심 분야 있어요? (넘어가도 돼요)
너: IT
Agent: 좋아요! 에이전트 만들러 가볼까요?
```

### Persona Builder (3분)

```
너: 경쟁사 블로그 알림 봇 만들어줘
Agent: 어떤 블로그요?
너: A사, B사
Agent: 언제 알려드릴까요?
너: 매일 아침
Agent: 정리해볼게요. [확인 요약] 이대로 만들까요?
너: 응
Agent: [persona.md, SOUL.md, config.md 생성]
```

---

## ⚠️ 주의사항

### 인간형 캐릭터만

```
✅ 파란 베레모 쓴 청년
✅ 주황색 후드 입은 소녀
❌ 부엉이, 토끼, 로봇
```

### 한 턴에 한 질문

```
❌ "어떤 블로그요? 언제 알려드릴까요?"
✅ "어떤 블로그요?" → (답변) → "언제 알려드릴까요?"
```

### 범위 밖 거절

```
너: 오늘 날씨 어때?
Agent: 저는 에이전트 만드는 걸 도와드려요. 날씨봇 만들어볼까요?
```

---

## 📂 생성되는 파일 경로

```
~/.myclaw/users/{user_id}/
├── profile.md
├── agents/{agent_id}/
│   ├── persona.md
│   ├── SOUL.md
│   └── config.md
└── context/interests.md
```

---

## 📝 상세 QA

- `docs/qa-scenarios/onboarding-qa.md` — 9개 시나리오
- `docs/qa-scenarios/persona-builder-qa.md` — 21개 시나리오
