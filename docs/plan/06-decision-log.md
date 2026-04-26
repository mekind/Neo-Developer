# Stage 6: Decision Log — MyClaw

## 서비스 개요

**MyClaw** — 비개발자가 대화만으로 AI 에이전트를 정의하고, Gather town 스타일 공간에서 도트 캐릭터로 만나 대화하는 플랫폼

---

## 핵심 결정 사항

### 1. 아키텍처
| 결정 | 내용 | 이유 |
|------|------|------|
| 세션 분리 | 온보딩/Persona Builder = Claude 세션, 에이전트 런타임 = OpenClaw | 역할 명확, OpenClaw 복잡성 은닉 |
| Memory 패턴 | llm-wiki 스타일 (폴더 + [[link]]) | 문서 간 연결, 컨텍스트 축적 |
| 멀티유저 | OpenClaw multi-agent routing | 한 서버에서 사용자별 격리 |

### 2. 제품 범위
| 결정 | 내용 |
|------|------|
| 에이전트 최대 개수 | 3개 (추후 요금제로 확장) |
| Tool(Skill) 목록 | 서비스 제공자가 사전 정의 (insane-search 등) |
| 타겟 사용자 | 비개발자 |

### 3. Persona Builder 동작
| 결정 | 내용 |
|------|------|
| 자연어 처리 | 다양한 입력 형태 → 의도 추출 |
| 범위 제한 | 에이전트 정의 전용, 잡담 거절 → 생성 유도 |
| Memory 참조 | 기존 정보 활용, 중복 질문 최소화 |
| clarify 전략 | 명확하면 진행, 불명확하면 질문 |

### 4. 에이전트 런타임
| 결정 | 내용 |
|------|------|
| 인사말 | static 랜덤 픽 (LLM 호출 X) |
| 말투 | formality 설정 (존댓말/반말) |
| 역할 범위 | SOUL.md에 정의, 범위 밖 거절 |

---

## 출력물 정의

### 사용자 Memory 구조
```
~/.myclaw/users/{user_id}/
├── index.md
├── log.md
├── profile.md
├── preferences.md
├── agents/
│   └── {agent_id}/
│       ├── persona.md    # 외형 (이미지 생성용)
│       ├── SOUL.md       # 성격/인사말/행동규칙
│       └── config.md     # skill/스케줄/채널
└── context/
    ├── interests.md
    └── history.md
```

### SOUL.md 핵심 필드
```yaml
formality: 반말/존댓말
greetings_alert: [알림 시 인사말 목록]
greetings_approach: [접근 시 인사말 목록]
behavior_rules: [행동 규칙]
boundaries: [하지 않는 것]
```

---

## 트레이드오프

| 선택 | 대안 | 선택 이유 |
|------|------|----------|
| Claude 세션 분리 | OpenClaw에서 전부 처리 | 복잡성 분리, 비개발자 친화적 |
| 인사말 static | LLM 생성 | 비용 절감, 응답 속도 |
| 에이전트 3개 제한 | 무제한 | MVP 단순화, 요금제 확장 가능 |

---

## 미해결 사항 (추후 결정)

| 항목 | 상태 | 담당 |
|------|------|------|
| 도트 캐릭터 이미지 생성 방식 | 미정 (AI vs 프리셋) | 시스템 아키텍처 |
| Gather 공간 크기/구조 | 미정 | UI 설계 |
| 요금제 상세 | 미정 | 비즈니스 |

---

## MVP 체크리스트

### Must Have
- [ ] Memory 시스템 기본 구조
- [ ] 온보딩 Agent
- [ ] Persona Builder Agent (핵심 흐름)
- [ ] 에이전트 1개 타입 동작
- [ ] Gather 공간 기본 UI

### Nice to Have
- [ ] 다양한 에이전트 타입
- [ ] 에이전트 수정/삭제
- [ ] 커스텀 이미지
- [ ] 스케줄 알림

---

## Seed (구현 이관용 핵심 요약)

### 한 줄 정의
> MyClaw: 대화로 AI 에이전트 만들고, Gather town에서 도트 캐릭터로 만나는 플랫폼

### 핵심 흐름
```
[온보딩] → profile.md 생성
[Persona Builder] → 자연어 → persona.md + SOUL.md + config.md
[Gather 공간] → 캐릭터 이동 → 에이전트에게 다가감 → 대화
[에이전트] → SOUL.md 기반 응답, 인사말 랜덤
```

### 기술 스택
- 온보딩/Builder: Claude 세션
- 에이전트 런타임: OpenClaw
- Memory: 파일 기반 (llm-wiki 패턴)
- UI: Gather town 스타일

### 핵심 제약
- 에이전트 최대 3개
- Tool은 사전 정의 목록에서 선택
- Persona Builder는 에이전트 정의 전용 (잡담 X)
