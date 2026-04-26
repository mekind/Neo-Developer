# Backend TODO (derived from `docs/plan`)

`docs/plan/01~06`에서 추출한 백엔드 작업 목록. 우선순위는 **MVP**(plan 04 §6 Must Have) 기준.

> 현재 상태: NestJS scaffold + 인메모리 mock `/items` CRUD + Vercel 배포 + GHA 파이프라인. **도메인 코드 0%**.

## 백엔드의 역할 (plan 분석 요약)

`plan`에서 백엔드(NestJS)가 책임지는 영역:

1. **Memory 영속화** — profile, preferences, agents/{id}/persona|SOUL|config, context/interests|history, index.md, log.md
2. **도메인 CRUD** — User, Agent (사용자당 ≤3), Skill 카탈로그
3. **Persona Builder 지원 데이터** — Memory 조회/갱신, Skill 매칭 정보
4. **에이전트 런타임 브리지** — SOUL.md 서빙, 인사말 랜덤 픽, OpenClaw 호출 (or webhook 수신)
5. **Cron 알림** — `greetings_alert` + skill 실행 트리거 (Vercel Cron Jobs)
6. **Gather 공간 상태** — 에이전트 배치/포지션 (MVP는 간단히)
7. **익명 사용자 식별** — `user_id` 헤더/쿠키, 정식 auth는 추후

> **백엔드가 직접 LLM을 호출하지 않음** — 온보딩/Builder는 Claude 세션, 런타임은 OpenClaw. 백엔드는 데이터/통합/제약 enforcement.

---

## P0 — MVP Critical (해커톤 데모 가능 최소 묶음)

### [BE-01] 영속화 스토리지 결정 + 도입 ✅ (스펙: `.omc/specs/deep-interview-be01-storage-foundation.md`)
- [x] 스토리지 = **Vercel Postgres / Neon** 채택
- [x] ORM = **Prisma 5** 채택 (postinstall로 generate 자동화)
- [x] `prisma/schema.prisma` 작성 (User, Profile, Agent, MemoryDocument, Skill)
- [x] 첫 마이그레이션 `prisma/migrations/20260426000000_init/`
- [x] `PrismaModule` (@Global) + `PrismaService` (lifecycle)
- [x] 5개 Repository 인터페이스 + Prisma 어댑터 + `RepositoriesModule`
- [x] `GET /health` (DB ping 포함)
- [x] env: `DATABASE_URL`, `DIRECT_URL` → `.env.example`, GHA 워크플로우, 문서 반영
- [x] GHA에 `prisma migrate deploy` 단계 추가
- [ ] **사용자 작업**: Vercel Postgres/Neon 프로비저닝, GitHub Secrets/Vercel Env에 두 URL 등록, 첫 `prisma migrate deploy` 또는 `migrate dev` 실행

### [BE-02] User 리소스
- [ ] `POST /users` — 익명 user 생성 (uuid 발급, 빈 profile.md 초기화, index.md/log.md 생성)
- [ ] `GET /users/:id` — profile + index 묶음 반환
- [ ] `PATCH /users/:id/profile` — 닉네임/목적/관심사 갱신 (온보딩 결과 수신)
- [ ] DTO + class-validator
- [ ] AC: plan US-01 (3-4 질문 내 완료, profile.md 생성)

### [BE-03] Memory CRUD (llm-wiki 패턴)
- [ ] `GET /users/:id/memory` — 사용자 전체 Memory 트리 반환 (index 기반)
- [ ] `GET /users/:id/memory/:path` — 단일 문서 조회 (예: `profile`, `preferences`, `agents/abc/SOUL`)
- [ ] `PUT /users/:id/memory/:path` — 마크다운 + frontmatter 저장
- [ ] `POST /users/:id/log` — append-only 이벤트 기록
- [ ] frontmatter 파싱 헬퍼 (gray-matter)
- [ ] `[[link]]` 추출 유틸 (선택)
- [ ] AC: plan FR-04, US-07 (재방문 시 Memory 활용)

### [BE-04] Agent 리소스 + 3개 제한
- [ ] `GET /users/:id/agents` — 사용자의 에이전트 목록 (각 entry는 persona summary)
- [ ] `POST /users/:id/agents` — Persona Builder 결과(persona/SOUL/config dict) 받아 Memory에 3종 파일로 저장
- [ ] `GET /users/:id/agents/:agentId` — persona + SOUL + config 묶음
- [ ] `PATCH /users/:id/agents/:agentId` — 부분 수정 (예: 알림 시간만)
- [ ] `DELETE /users/:id/agents/:agentId`
- [ ] **3개 제한 enforcement** → 4번째 생성 시 `409` + 안내 메시지 (plan VC-10)
- [ ] AC: US-02, US-06, VC-10

### [BE-05] Skill 카탈로그
- [ ] `GET /skills` — 사전 정의된 skill 목록 (`insane-search` 등) + 메타데이터
- [ ] 데이터 소스: 코드 내 정적 배열 (MVP) — 나중에 DB로 이전
- [ ] 각 skill: `id`, `name`, `description`, `triggers[]`, `defaultParams`
- [ ] AC: Persona Builder가 이걸 매칭 후보로 사용 (FR-02-2)

### [BE-06] 인사말 랜덤 픽 엔드포인트
- [ ] `GET /users/:id/agents/:agentId/greeting?type=alert|approach`
- [ ] SOUL.md의 `greetings_alert` / `greetings_approach` 배열에서 random pick
- [ ] **LLM 호출 금지** (plan 4.3, FR-03-2: static random)
- [ ] AC: US-05, VC-11

### [BE-07] 익명 사용자 식별 (간이 auth)
- [ ] 헤더 `x-user-id` 또는 `Authorization: Bearer <user_id>` 인식
- [ ] NestJS `Guard` + `@CurrentUser()` 데코레이터
- [ ] 미인증/잘못된 id → 401
- [ ] AC: 모든 `/users/:id/*` 엔드포인트가 본인 자원만 접근 가능

---

## P1 — Nice to Have (시간 되면)

### [BE-08] Vercel Cron Jobs으로 알림 트리거
- [ ] `vercel.json`에 `crons` 추가 (예: 매일 8시)
- [ ] `POST /cron/agent-tick` — 모든 활성 에이전트 스케줄 점검 → skill 실행 → 알림 큐
- [ ] 알림 데이터 저장 (`notifications` 리소스)
- [ ] AC: US-05 알림 흐름 (FR-03-5)

### [BE-09] OpenClaw 런타임 브리지
- [ ] `POST /agents/:agentId/invoke` — 사용자 입력 + SOUL 컨텍스트 → OpenClaw 호출 → 응답
- [ ] OpenClaw endpoint URL은 env (`OPENCLAW_BASE_URL`)
- [ ] timeout / retry 정책
- [ ] AC: VC-06, VC-07 (역할 내/밖 응답)

### [BE-10] 알림 조회/소비
- [ ] `GET /users/:id/notifications` — 미확인 알림 목록
- [ ] `POST /users/:id/notifications/:notifId/ack`
- [ ] AC: 알림이 인게임 캐릭터로 표시되도록 프론트 폴링 가능

### [BE-11] Gather 공간 상태
- [ ] `GET /users/:id/space` — 캐릭터 위치, 에이전트 배치
- [ ] `PATCH /users/:id/space` — 위치 갱신 (디바운스/throttle은 프론트 책임)
- [ ] 실시간 동기화는 MVP 단계 폴링 (WebSocket 추후)

### [BE-12] 외형(persona.md)에서 이미지 프롬프트 추출 API
- [ ] `GET /users/:id/agents/:agentId/persona/prompt` — pixel art prompt 반환
- [ ] 이미지 생성은 프론트 또는 별도 서비스 책임 (plan Open Question)

---

## P2 — 운영 / 품질

### [BE-13] 통합 테스트
- [ ] supertest + jest e2e 셋업
- [ ] plan VC-01~VC-11 시나리오를 e2e로 작성
- [ ] CI에서 `npm run test:e2e` 실행

### [BE-14] 로깅 / 에러 핸들링 정리
- [ ] 글로벌 ExceptionFilter — 일관된 에러 포맷 (`docs/backend/api.md`의 `ApiError` 스키마)
- [ ] 구조화 로그 (Pino) — request id, user id 포함

### [BE-15] OpenAPI 스펙 자동 생성
- [ ] `@nestjs/swagger` 도입 → `/docs` 엔드포인트 (또는 `swagger.json` 정적 생성)
- [ ] 프론트가 타입 자동 생성 가능

### [BE-16] 환경변수/시크릿 정리
- [ ] `KV_URL`, `KV_TOKEN`, `OPENCLAW_BASE_URL`, `CRON_SECRET` 등 추가 시
  - GitHub Secrets 등록
  - Vercel 프로젝트 Environment Variables 등록
  - `.env.example` 업데이트

### [BE-17] mock `/items` 제거
- [ ] 도메인 리소스 도입 후 `items.module` 일괄 삭제
- [ ] `docs/backend/api.md`도 동기화

---

## 의존 관계 / 권장 순서

```
BE-01 (스토리지) ──┬─> BE-02 (User) ─┬─> BE-03 (Memory) ─> BE-04 (Agent) ─> BE-06 (Greeting)
                  │                 │
                  │                 └─> BE-07 (Auth Guard)
                  │
                  └─> BE-05 (Skill catalogue, 독립)

BE-04 끝나면 ────> BE-08 (Cron) / BE-09 (OpenClaw) / BE-10 (Notifications)

BE-13~17은 도메인 코드 진행과 병행
```

권장 첫 스프린트: **BE-01 → BE-02 → BE-03 → BE-04 → BE-05 → BE-06 → BE-07** 까지 끝나면 plan US-01/US-02/US-03/US-05/US-07 + VC-10/VC-11이 백엔드 측에서 검증 가능한 상태가 됩니다.

---

## Open Questions (백엔드 결정 필요)

| 질문 | 영향 |
|---|---|
| 스토리지 = Vercel KV vs Postgres vs Blob | BE-01 전체 |
| OpenClaw runtime 호출 위치 = 백엔드 프록시 vs 프론트 직호출 | BE-09 존재 여부 |
| 인증 = 익명 user_id only vs OAuth | BE-07 범위 |
| Skill 카탈로그 정적 vs 관리 가능 | BE-05 데이터 모델 |
| Cron = Vercel Cron vs 외부 스케줄러 | BE-08 구현 방식 |

위 질문들이 정해지면 P0 작업 분해를 더 구체화할 수 있습니다.
