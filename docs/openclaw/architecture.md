# Architecture

## 1. 컴포넌트 다이어그램

```
┌────────────────────────────────────────────────────────────────────┐
│                          Frontend (Gather UI)                      │
└─────────────────────────────┬──────────────────────────────────────┘
                              │ HTTPS
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│              NestJS Backend (Vercel — aim-backend)                 │
│  - User / Memory / Agent / Skill / Notifications CRUD              │
│  - Auth (x-user-id), 3개 제한 enforcement                          │
│  - Postgres (Prisma)                                               │
└─────────┬─────────────────────────────────────────▲────────────────┘
          │ POST /api/invoke                        │ PUT /users/.../notifications
          │ POST /api/tick (cron, by Vercel)        │ PUT /users/.../memory/...
          ▼                                         │
┌────────────────────────────────────────────────────────────────────┐
│           OpenClaw Runtime (Vercel — aim-openclaw)                 │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Route Handlers                                              │  │
│  │  - POST /api/invoke   (사용자 발화 처리)                     │  │
│  │  - POST /api/tick     (cron 알림 트리거)                     │  │
│  │  - GET  /api/health                                          │  │
│  └──────────────────────────┬───────────────────────────────────┘  │
│                             │                                      │
│  ┌──────────────────────────▼───────────────────────────────────┐  │
│  │  Runtime Pipeline                                            │  │
│  │  1. load-agent       (NestJS에서 SOUL/config/Memory 페치)    │  │
│  │  2. build-system-prompt  (SOUL → prompt)                     │  │
│  │  3. guardrails       (boundaries / out-of-scope)             │  │
│  │  4. select-skills    (config.md → tool registry 필터)        │  │
│  │  5. run              (AI SDK generateText/streamText)        │  │
│  │  6. write-back       (history append, notifications PUT)     │  │
│  └──────────────────────────┬───────────────────────────────────┘  │
│                             │                                      │
│  ┌──────────────────────────▼───────────────────────────────────┐  │
│  │  Skill Registry (내부 함수)                                  │  │
│  │  - insane-search                                             │  │
│  │  - summarize                                                 │  │
│  │  - (...추후 추가)                                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────┬───────────────────────────────────────────────────┬──────┘
          │                                                   │
          ▼                                                   ▼
   ┌────────────────────┐                          ┌────────────────────┐
   │  Vercel AI Gateway │                          │  External APIs     │
   │  (LLM provider     │                          │  (검색/크롤링 등)  │
   │   abstraction)     │                          │                    │
   └────────────────────┘                          └────────────────────┘
```

## 2. 책임 분리

| 컴포넌트 | 담당 | 비담당 |
|---|---|---|
| Frontend | Gather 공간 UI, 사용자 입력, 알림 렌더 | LLM 호출 |
| NestJS Backend | 데이터 영속, 제약 enforcement, 인증, 알림 저장/조회 | LLM 호출, Skill 실행 |
| OpenClaw | LLM 호출, Skill 실행, 시스템 프롬프트 구성, 가드레일 | 데이터 영속, 인증, UI |

## 3. 호출 시퀀스 — 사용자 발화 처리

```
User → Frontend
Frontend ──[사용자 입력]──▶ NestJS /agents/:id/invoke (proxy)
                            ├─ Auth 검증
                            ├─ Memory 컨텍스트 스냅샷 생성
                            └─▶ OpenClaw POST /api/invoke
                                  ├─ 1. SOUL/config 로드 (NestJS)
                                  ├─ 2. system prompt 빌드
                                  ├─ 3. guardrail 체크
                                  ├─ 4. tools = config.skills 매핑
                                  ├─ 5. AI SDK generateText (Gateway)
                                  │    ├─ tool call → Skill.execute()
                                  │    └─ 최종 응답
                                  ├─ 6. history append (PUT NestJS)
                                  └─◀ { reply, used_skills }
                            ◀── reply 반환
                  ◀── reply 표시
```

## 4. 호출 시퀀스 — Cron 알림

```
Vercel Cron ──[*/5 * * * *]──▶ OpenClaw POST /api/tick
                                ├─ CRON_SECRET 검증
                                ├─ NestJS GET /agents?dueAt=now
                                ├─ for each agent:
                                │    ├─ load SOUL/config/memory
                                │    ├─ skill 실행 (e.g. insane-search)
                                │    ├─ 결과 요약 (LLM)
                                │    └─ NestJS POST /users/:id/notifications
                                │         { agentId, body, kind: 'alert' }
                                └─◀ { processed: N }
```

알림 인사말(`greetings_alert`) 자체는 NestJS BE-06 엔드포인트가 static random pick. OpenClaw는 **본문**만 만들고, NestJS가 인사말과 합쳐 클라이언트에 노출.

## 5. 데이터 흐름 (Memory)

OpenClaw는 Memory를 **읽기 전용 컨텍스트**로 받음:

```
NestJS → MemorySnapshot {
  profile: { name, purpose, tech_level, ... },
  preferences: { tone, notification_time, ... },
  interests: ['마케팅', '트렌드', ...],
  recent_history: [...최근 N개 이벤트]
}
```

쓰기는 항상 NestJS의 Memory CRUD로 PUT:
- `PUT /users/:id/memory/agents/:agentId/SOUL` — Builder가 갱신 시
- `POST /users/:id/log` — 활동 이벤트 (OpenClaw가 호출)

## 6. 신뢰 / 보안 모델

| 경계 | 인증 |
|---|---|
| Frontend → NestJS | `x-user-id` (BE-07 익명 auth) |
| NestJS → OpenClaw | `Authorization: Bearer ${BACKEND_SERVICE_TOKEN}` |
| OpenClaw → NestJS | `Authorization: Bearer ${BACKEND_SERVICE_TOKEN}` (동일 토큰) |
| Vercel Cron → OpenClaw | `Authorization: Bearer ${CRON_SECRET}` |

서비스간 토큰은 양방향 동일 시크릿(MVP). 추후 mTLS 또는 OIDC로 격상.

## 7. 확장성 고려

| 차원 | 현재 | 미래 |
|---|---|---|
| Skill 실행 | 내부 함수 | registry에 `runtime: 'inline' \| 'sandbox'` 필드 추가, 사용자 정의 스킬은 Vercel Sandbox로 |
| LLM provider | Gateway 단일 | Gateway routing rule (모델별 분기) |
| 응답 방식 | generateText | streamText (UX 개선) |
| 장기 작업 | Function 안에서 처리 | Vercel Workflow (WDK) 도입 |
| 실시간성 | 폴링 | SSE → WebSocket (별도 게이트웨이 필요) |

## 8. 비기능 요구

| 항목 | 목표 |
|---|---|
| 호출 P50 | < 2초 (LLM 호출 포함) |
| 호출 P99 | < 8초 |
| Cron tick | 5분 주기, tick당 N개 agent 처리 (병렬) |
| 가용성 | Vercel 기본 (single region 시작, 필요 시 multi) |
| 관측 | Vercel Logs + AI Gateway 대시보드 |
