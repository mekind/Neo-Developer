# Stage 4: Requirement Structuring

## 1. User Stories

### US-01: 온보딩
> **As a** 비개발자 신규 사용자  
> **I want to** 대화로 나를 소개하고  
> **So that** 플랫폼이 나에게 맞는 경험을 제공해줄 수 있다

**Acceptance Criteria**:
- [ ] 3-4개 질문 내로 온보딩 완료
- [ ] 닉네임, 목적 수집
- [ ] Memory에 profile.md 생성
- [ ] 온보딩 완료 후 Gather 공간으로 입장

---

### US-02: 에이전트 생성 (명확한 요청)
> **As a** 사용자  
> **I want to** "이런 거 해주는 봇 만들어줘"라고 말하면  
> **So that** 내가 원하는 에이전트가 생성된다

**Acceptance Criteria**:
- [ ] 자연어 입력 → 역할 추출
- [ ] 관련 Tool 자동 매칭
- [ ] 빠진 정보만 추가 질문
- [ ] persona.md, SOUL.md, config.md 생성
- [ ] 도트 캐릭터로 공간에 등장

---

### US-03: 에이전트 생성 (모호한 요청)
> **As a** 뭘 만들지 모르는 사용자  
> **I want to** "뭐 만들 수 있어?"라고 물으면  
> **So that** 예시를 보고 선택할 수 있다

**Acceptance Criteria**:
- [ ] 예시 3-4개 제시 (알림봇, 대화친구, 리마인더 등)
- [ ] 선택 시 해당 유형으로 clarify 진행
- [ ] 예시 없이 자유롭게 말해도 처리 가능

---

### US-04: 에이전트와 대화
> **As a** 사용자  
> **I want to** Gather 공간에서 에이전트 캐릭터에게 다가가서 말 걸면  
> **So that** 에이전트가 정의된 역할에 맞게 응답한다

**Acceptance Criteria**:
- [ ] 캐릭터에게 다가가면 대화 시작
- [ ] 페르소나에 맞는 인사말 (static random)
- [ ] 역할 범위 내 질문 → 응답
- [ ] 역할 범위 밖 → "내 전문이 아니야" 류 거절

---

### US-05: 에이전트 알림
> **As a** 사용자  
> **I want to** 에이전트가 알려줄 게 있으면 페르소나에 맞게 불러주면  
> **So that** 인게임 느낌으로 알림을 받는다

**Acceptance Criteria**:
- [ ] 알림 시 `greetings_alert`에서 랜덤 픽
- [ ] 페르소나 formality에 맞는 말투
- [ ] LLM 호출 없이 static 처리

---

### US-06: 에이전트 수정
> **As a** 사용자  
> **I want to** 에이전트에게 "알림 시간 바꿔줘"라고 말하면  
> **So that** 설정이 변경된다

**Acceptance Criteria**:
- [ ] 자연어로 수정 요청
- [ ] config.md 업데이트
- [ ] 변경 확인 메시지

---

### US-07: Memory 활용
> **As a** 재방문 사용자  
> **I want to** 이전에 말한 정보를 다시 안 물어봤으면  
> **So that** 빠르게 새 에이전트를 만들 수 있다

**Acceptance Criteria**:
- [ ] Persona Builder가 Memory 참조
- [ ] 이미 아는 정보 → 확인만 or 스킵
- [ ] 새 정보 → 질문 후 Memory 업데이트

---

## 2. Functional Requirements

### FR-01: 온보딩 Agent
| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-01-1 | 대화형 온보딩 (폼 X) | Must |
| FR-01-2 | 3-4개 질문 내 완료 | Must |
| FR-01-3 | Memory에 profile.md 생성 | Must |
| FR-01-4 | tech_level 암묵적 추론 | Should |

### FR-02: Persona Builder Agent
| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-02-1 | 자연어 입력 → 의도 추출 | Must |
| FR-02-2 | Tool 자동 매칭 | Must |
| FR-02-3 | persona.md 생성 | Must |
| FR-02-4 | SOUL.md 생성 (인사말 포함) | Must |
| FR-02-5 | config.md 생성 | Must |
| FR-02-6 | Memory 참조 (기존 정보 활용) | Must |
| FR-02-7 | 범위 밖 요청 거절 → 에이전트 생성 유도 | Must |
| FR-02-8 | 예시 제시 (모호한 요청 시) | Should |

### FR-03: 에이전트 런타임
| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-03-1 | SOUL.md 기반 성격/말투 | Must |
| FR-03-2 | 인사말 static random pick | Must |
| FR-03-3 | Tool(Skill) 실행 | Must |
| FR-03-4 | 역할 범위 밖 거절 | Must |
| FR-03-5 | 스케줄 기반 알림 | Should |

### FR-04: Memory 시스템
| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-04-1 | llm-wiki 패턴 폴더 구조 | Must |
| FR-04-2 | [[link]] 형태 문서 연결 | Must |
| FR-04-3 | index.md 허브 | Must |
| FR-04-4 | log.md append-only | Should |

### FR-05: Gather 공간 (UI)
| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-05-1 | 캐릭터 이동 (WASD/화살표) | Must |
| FR-05-2 | 에이전트 캐릭터 배치 | Must |
| FR-05-3 | 다가가면 대화 시작 | Must |
| FR-05-4 | [+] 버튼 → Persona Builder | Must |
| FR-05-5 | 도트 캐릭터 렌더링 | Must |

---

## 3. Constraints

| 제약사항 | 설명 |
|---------|------|
| **기술 스택** | OpenClaw 기반 (백엔드), Claude 세션 (온보딩/Persona Builder) |
| **타겟 사용자** | 비개발자 → 모든 용어 쉽게, 설정 최소화 |
| **Tool 목록** | 서비스 제공자가 사전 정의 (insane-search 등) |
| **해커톤 시간** | 제한된 시간 → MVP 범위 집중 |
| **멀티유저** | OpenClaw multi-agent routing 활용 |

---

## 4. Success Criteria

| 기준 | 측정 방법 |
|------|----------|
| **온보딩 완료율** | 3-4개 질문 내 완료 비율 |
| **첫 에이전트 생성 시간** | 접속 → 첫 봇 생성까지 5분 이내 |
| **자연어 의도 파악률** | 다양한 표현 → 올바른 역할 추출 |
| **에이전트 동작 정확도** | 정의된 역할대로 응답하는 비율 |
| **재방문 사용자 질문 감소** | Memory 활용으로 중복 질문 제거 |

---

## 5. Open Questions / Assumptions

### Open Questions
| 질문 | 상태 |
|------|------|
| 도트 캐릭터 이미지 생성 방식? (AI 생성 vs 프리셋) | 미정 |
| Gather 공간 크기/구조? | 미정 |
| 에이전트 최대 개수 제한? | **3개** (추후 요금제로 확장) |

### Assumptions
| 가정 | 근거 |
|------|------|
| OpenClaw가 multi-agent routing 지원 | 공식 문서 확인 |
| insane-search 등 기존 skill 사용 가능 | 사용자 확인 |
| Claude 세션이 별도로 동작 | 사용자 확인 |
| 비개발자가 주 타겟 | 사용자 확인 |

---

## 6. MVP 범위 제안

해커톤 시간 제약 고려, 다음을 MVP로 제안:

### Must Have (MVP)
- [ ] 온보딩 Agent (간단 버전)
- [ ] Persona Builder Agent (핵심 흐름)
- [ ] 에이전트 1개 타입 동작 (예: 알림봇)
- [ ] Gather 공간 기본 UI
- [ ] Memory 기본 구조

### Nice to Have
- [ ] 다양한 에이전트 타입
- [ ] 에이전트 수정/삭제
- [ ] 도트 캐릭터 커스텀 이미지
- [ ] 스케줄 기반 알림
- [ ] Memory 고도화 (link, log)

---

## 7. 검토 필요

1. **MVP 범위** 이 정도면 적절한가요?
2. **Open Questions** 중 지금 결정해야 할 것이 있나요?
3. **추가 요구사항** 빠진 것이 있나요?
