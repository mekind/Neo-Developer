# Backend TODO (derived from `docs/plan`)

`docs/plan/01~06`에서 추출한 백엔드 작업 목록. 우선순위는 **MVP**(plan 04 §6 Must Have) 기준.

> 현재 상태 (2026-04-26 기준): P0 도메인(BE-02 ~ BE-06) + Prisma/Postgres(BE-01) + Docker compose + e2e 테스트(BE-13) + Swagger UI(BE-15) 완료. BE-07(Auth)는 단일 user 테스트 계획에 따라 **보류**. P1 / 운영 항목은 미진행.

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

### [BE-02] User 리소스 ✅ (PR #19)
- [x] `POST /users` — 익명 uuid 발급
- [x] `GET /users/:id` — user + profile (없으면 profile=null, 404)
- [x] `PATCH /users/:id/profile` — 닉네임/목적/techLevel upsert (검증 400)
- [x] DTO + class-validator (`UpsertProfileDto`)
- [x] e2e: `backend/test/users.e2e-spec.ts` 7건 통과
- [x] AC: plan US-01

### [BE-03] Memory CRUD (llm-wiki 패턴) ✅ (PR #20)
- [x] `GET /users/:userId/memory` — 인덱스 (path/frontmatter/updatedAt)
- [x] `GET /users/:userId/memory/*` — 단일 문서 (와일드카드)
- [x] `PUT /users/:userId/memory/*` — frontmatter 미제공 시 gray-matter 자동 파싱
- [x] `POST /users/:userId/log` — append-only (가장 최근 항목이 헤더 바로 아래)
- [x] e2e: `backend/test/memory.e2e-spec.ts` 7건 통과
- [ ] `[[link]]` 추출 유틸 (선택, 후속 작업)

### [BE-04] Agent 리소스 + 3개 제한 ✅ (PR #21)
- [x] 5개 엔드포인트 (list/create/get/patch/delete)
- [x] persona/SOUL/config은 `MemoryDocument`의 `agents/{id}/{persona|SOUL|config}` 경로에 저장
- [x] **3개 제한** — 4번째 시 409 "에이전트는 최대 3개까지 만들 수 있어요"
- [x] DELETE 시 관련 MemoryDocument도 정리, 슬롯 회복
- [x] e2e: `backend/test/agents.e2e-spec.ts` 8건 통과 (VC-10 포함)

### [BE-05] Skill 카탈로그 ✅ (PR #22)
- [x] `backend/src/skills/skill-catalog.ts` 5개 preset (insane-search, rss-watcher, summarizer, reminder, calendar-reader)
- [x] `SkillsService.onModuleInit` 부팅 시 idempotent upsert (DB 다운 시 warn 후 통과)
- [x] `GET /skills` — enabled 목록
- [x] e2e: `backend/test/skills.e2e-spec.ts` 2건

### [BE-06] 인사말 랜덤 픽 엔드포인트 ✅ (PR #23)
- [x] `GET /users/:userId/agents/:agentId/greeting?type=alert|approach`
- [x] SOUL.md frontmatter 의 배열에서 `Math.random()` 픽 (LLM 호출 0)
- [x] 빈 배열 → `text: null`, 잘못된 type → 400
- [x] e2e: `backend/test/greetings.e2e-spec.ts` 6건

### [BE-07] 익명 사용자 식별 (간이 auth) — 보류
- 단일 user 테스트 계획 따라 **deferred**. 코드는 구현됐었으나 PR #24 closed (브랜치 삭제). 멀티 user 진행 시 재도입.

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

### [BE-13] 통합 테스트 ✅ (PR #29)
- [x] Jest + supertest 셋업, `npm run test:e2e`
- [x] 6 스위트 / 31 테스트 — health/users/memory/agents/skills/greetings
- [x] `pretest:e2e` 가 `prisma migrate deploy` 자동 실행
- [x] 가이드: `docs/backend/test/README.md`
- [ ] CI 자동 실행 — 사용자 요청으로 보류 (로컬 전용)

### [BE-14] 로깅 / 에러 핸들링 정리
- [ ] 글로벌 ExceptionFilter — 일관된 에러 포맷 (`docs/backend/api.md`의 `ApiError` 스키마)
- [ ] 구조화 로그 (Pino) — request id, user id 포함

### [BE-15] OpenAPI 스펙 자동 생성 ✅ (PR #34)
- [x] `@nestjs/swagger@7.4` + `swagger-ui-express@5`
- [x] `GET /docs` — Swagger UI, `GET /docs-json` — OpenAPI 3 spec
- [x] `nest-cli.json` 에 `@nestjs/swagger` 플러그인 → DTOs 자동 ApiProperty
- [x] 7 controllers 에 ApiTags + 핵심 ApiOperation (agents POST 의 409 명시)
- [x] 프론트는 OpenAPI Generator/openapi-typescript 등으로 타입 추출 가능

### [BE-16] 환경변수/시크릿 정리 — 부분 진행
- [x] `DATABASE_URL`, `DIRECT_URL` 등록 (BE-01 와 함께)
- [ ] `OPENCLAW_BASE_URL` (BE-09 도입 시)
- [ ] `CRON_SECRET` (BE-08 도입 시)

### [BE-17] mock `/items` 제거
- [ ] 도메인 리소스 도입 후 `items.module` 일괄 삭제
- [ ] `docs/backend/api.md`도 동기화 (현재 mock 명세 → P0 명세 또는 Swagger UI 링크로 대체)

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
