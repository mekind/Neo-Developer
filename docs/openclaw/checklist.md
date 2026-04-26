# OpenClaw 실행 체크리스트

`docs/openclaw/*` 9개 문서를 바탕으로 만든 **실행 가능한 평면 체크리스트**.
하나씩 체크하며 진행. 각 항목은 파일 경로, 명령어, AC를 포함.

> 상위 작업 정의: [todo.md](./todo.md) (OC-01 ~ OC-14)
> 본 문서는 그 하위 실행 단계.

---

## Phase 0 — 사전 결정 (코드 시작 전)

> 외부 셋업 절차 상세는 [setup-guide.md](./setup-guide.md) 참조.

- [x] **레포 형태 최종 확정**: **monorepo 폴더 `AIM/openclaw/` + 별도 Vercel 프로젝트** 채택
  - `decisions.md` D-01 개정 완료
- [ ] **OpenClaw용 Vercel 프로젝트 생성** (root directory = `AIM/openclaw`, Ignored Build Step 적용)
- [ ] **AI Gateway 활성화** + Anthropic provider 등록 + ZDR 옵션
- [x] **NestJS 페어 작업 BE-18~22** backend todo P3 섹션에 등록 완료
- [ ] **공유 토큰 생성 + 등록** (`BACKEND_SERVICE_TOKEN` 양쪽 동일, `CRON_SECRET` OpenClaw)
- [ ] **NestJS env 추가**: `OPENCLAW_BASE_URL`, `BACKEND_SERVICE_TOKEN`

---

## Phase 1 — 스캐폴드 (OC-01)

- [ ] repo 초기화 (monorepo 폴더 채택 — D-01 참조)
  ```bash
  cd /path/to/AIM    # monorepo root
  npx create-next-app@latest openclaw \
    --ts --app --no-tailwind --src-dir --import-alias "@/*"
  cd openclaw
  pnpm add ai zod @ai-sdk/gateway
  pnpm add -D @types/node
  ```
- [ ] `package.json` scripts: `dev` 포트 3001로 변경
- [ ] `vercel.ts` 작성 (`framework: nextjs`, crons placeholder)
- [ ] `.env.example` 작성 (5개 키, 값 없이)
- [ ] `app/api/health/route.ts` — 헬스체크 응답
- [ ] `app/page.tsx` — 빌드용 stub (서비스 안내 한 줄)
- [ ] `vercel link`
- [ ] 5개 env 등록 (preview/prod 분리)
  - [ ] `AI_GATEWAY_API_KEY`
  - [ ] `BACKEND_BASE_URL`
  - [ ] `BACKEND_SERVICE_TOKEN`
  - [ ] `CRON_SECRET`
  - [ ] `DEFAULT_MODEL` = `anthropic/claude-haiku-4-5`
- [ ] 첫 preview 배포 성공
- [ ] **AC**: `curl https://<preview>/api/health` → 200 + `{ ok: true }`

---

## Phase 2 — `/api/invoke` 골격 (OC-02)

### 타입 정의
- [ ] `src/types/contracts.ts` — `InvokeRequest`, `InvokeResponse`, `SoulDoc`, `ConfigDoc`, `MemorySnapshot`
- [ ] `src/types/zod-schemas.ts` — 동일 타입의 zod 스키마

### 미들웨어
- [ ] `src/middleware/auth.ts` — `Authorization: Bearer ${BACKEND_SERVICE_TOKEN}` 검증
- [ ] 토큰 불일치 → 401

### Runtime
- [ ] `src/clients/ai.ts` — gateway provider + `DEFAULT_MODEL` 폴백
- [ ] `src/runtime/build-system-prompt.ts` — SOUL → prompt 직렬화 (`runtime.md` §2)
- [ ] `src/runtime/run.ts` — `generateText` 호출 (skill 없이)
- [ ] `src/runtime/format-response.ts` — `InvokeResponse` 변환 + tokens 매핑

### Route handler
- [ ] `app/api/invoke/route.ts` — POST 진입점, zod parse → runtime 호출
- [ ] 에러 매핑 (400/401/422/500/504)

### 검증
- [ ] `fixtures/invoke.example.json` 작성
- [ ] 로컬 `pnpm dev` 후 `curl` 테스트
- [ ] **AC**: SOUL/memory만으로 평문 응답 200

---

## Phase 3 — Guardrails (OC-03)

- [ ] `src/runtime/guardrails.ts`
  - [ ] `matchesAnyBoundary(input, soul.boundaries)` — 단어/패턴 기반
  - [ ] `matchesUnsafePattern(input)` — safety 룰
  - [ ] `pickOutOfScopePhrase(formality)` — 반말/존댓말 분기
- [ ] runtime 파이프라인에 pre-LLM 단계 추가
- [ ] 거절 시 LLM 호출 스킵, `refused.reason` 설정
- [ ] **AC (plan VC-05/VC-07)**:
  - [ ] "오늘 날씨 어때?" → out_of_scope 거절
  - [ ] "1+1 뭐야?" → out_of_scope 거절
  - [ ] formality에 맞는 톤

---

## Phase 4 — Skill Registry + insane-search (OC-04)

### 모델
- [ ] `src/skills/types.ts` — `Skill`, `SkillContext`
- [ ] `src/skills/to-ai-tool.ts` — Skill → AI SDK `tool()` 변환

### Registry
- [ ] `src/skills/index.ts` — `skillRegistry` 객체
- [ ] `src/skills/insane-search.ts`
  - [ ] zod schema (query, sources, since, limit)
  - [ ] execute (외부 검색 API 호출 또는 mock)
  - [ ] `signal` 전달
- [ ] `src/skills/summarize.ts` (optional MVP)

### 파이프라인 통합
- [ ] `src/runtime/select-skills.ts` — config.skills enabled 필터
- [ ] `runtime/run.ts`에 `tools` + `toolChoice: 'auto'` + `maxToolRoundtrips: 4` 적용
- [ ] **AC**: "오늘 새 글 있어?" → tool call → 응답에 `used_skills: ['insane-search']`

---

## Phase 5 — Backend Write-back (OC-05)

- [ ] `src/clients/backend.ts` — fetch 래퍼, 서비스 토큰 자동 주입, retry 1회
- [ ] `src/runtime/write-back.ts`
  - [ ] `appendLog(user_id, event)` — `POST /users/:id/log`
  - [ ] `Promise.allSettled` — 실패해도 응답 영향 없음
- [ ] **`[BE-paired]`** NestJS `POST /users/:id/log` 보장 (서비스 토큰 인증)
- [ ] **AC**: invoke 1회 후 NestJS log에 `agent:<id>:reply` 이벤트 기록

---

## Phase 6 — Cron Tick (OC-06)

### Backend pair
- [ ] **`[BE-paired]`** NestJS `GET /agents/due?at=${iso}` 신설 → 만기 에이전트 + 컨텍스트 묶음 반환
- [ ] **`[BE-paired]`** NestJS `POST /users/:id/notifications` 보장 (kind=alert, body, agentId)

### OpenClaw
- [ ] `app/api/tick/route.ts`
  - [ ] `CRON_SECRET` 검증
  - [ ] backend.dueAgents(now) 페치
  - [ ] 동시성 제한 처리 (`p-limit` 5)
  - [ ] 각 agent에 대해 invoke 파이프라인 reuse
  - [ ] 결과를 backend.createNotification으로 PUT
  - [ ] 집계 응답 (`processed`, `succeeded`, `failed`, `duration_ms`)
- [ ] `vercel.ts` crons 항목 추가: `*/5 * * * *`
- [ ] **AC (plan VC-08)**:
  - [ ] 수동 `curl POST /api/tick` 시 NestJS notifications에 새 row 생성
  - [ ] 배포 후 5분 cron 실제 발화 로그 확인

---

## Phase 7 — Streaming (OC-07, P1)

- [ ] `runtime/run.ts`에 `streamText` 옵션 추가
- [ ] `app/api/invoke/route.ts` — `Accept: text/event-stream`이면 stream 반환
- [ ] **`[BE-paired]`** NestJS proxy도 stream pass-through 가능하게
- [ ] **AC**: 프론트에서 응답 토큰 단위 표시

---

## Phase 8 — 관측 (OC-08, P1)

- [ ] `src/lib/log.ts` — 구조화 JSON 로그 헬퍼
- [ ] invoke/tick 표준 필드 (`evt`, `user_id`, `agent_id`, `duration_ms`, `tokens_*`, `skills_used`, `model`, `refused`)
- [ ] AI Gateway 대시보드에서 모델별 사용량 확인
- [ ] (선택) Pino + 외부 collector

---

## Phase 9 — 모델 분기 (OC-09, P1)

- [ ] SOUL `model` 필드 우선순위 적용
- [ ] 입력 길이/툴 사용 여부 휴리스틱 → Haiku/Sonnet 선택
- [ ] AI Gateway routing rule 활용 검토

---

## Phase 10 — 캐시 (OC-10, P1)

- [ ] Vercel Runtime Cache API 도입
- [ ] insane-search 결과 키 = `query + sources hash` 캐시 (TTL 10분)
- [ ] cacheTag로 사용자 요청 시 무효화 가능

---

## Phase 11 — 공유 타입 패키지 (OC-11, P1)

- [ ] `@aim/contracts` 패키지 추출 결정 (npm/git submodule/monorepo)
- [ ] OpenClaw + NestJS 양쪽 import
- [ ] CI에서 타입 일치 보장

---

## Phase 12 — 테스트/품질 (OC-12~14, P2)

- [ ] `vitest` + `supertest` 셋업
- [ ] e2e 시나리오: plan VC-05/06/07/08
- [ ] k6/Artillery 부하 측정 — P50 < 2s, P99 < 8s
- [ ] AI Gateway 일일 토큰 한도 알림
- [ ] 비정상 호출 패턴 검출 룰

---

## NestJS 페어 작업 (BE-18 ~ BE-22 후보)

`docs/backend/todo.md`에 추가 등록 필요. OpenClaw가 정상 동작하려면 모두 필요.

- [x] **BE-18** `OpenclawClient` 모듈 (HTTP client, BACKEND_SERVICE_TOKEN, retry) — PR #46 머지
- [ ] **BE-19** `POST /agents/:agentId/invoke` (frontend → NestJS → OpenClaw proxy, x-user-id auth)
  - [ ] Memory snapshot 빌더 (profile + preferences + interests + recent_history)
- [ ] **BE-20** `GET /agents/due?at=${iso}` (cron 보조)
  - [ ] config.schedule cron expression 매칭 로직
- [ ] **BE-21** `POST /users/:id/notifications` (서비스 토큰 인증)
  - [ ] body 스키마: `{ agentId, kind: 'alert' | 'message', body, used_skills?, ts }`
- [ ] **BE-22** `POST /users/:id/log` (서비스 토큰 인증, append-only)
- [ ] env 추가: `OPENCLAW_BASE_URL`, `BACKEND_SERVICE_TOKEN`

---

## 사전 진행 가능한 작업 (블로커 없음)

NestJS BE-18~22가 늦어도 OpenClaw 단독으로 진행 가능한 항목:

- [x] 문서 작성 (완료)
- [ ] Phase 1 스캐폴드 + 첫 배포
- [ ] Phase 2 invoke 골격 (NestJS mock fixture로 테스트)
- [ ] Phase 3 guardrails
- [ ] Phase 4 skill registry + insane-search

Phase 5/6은 NestJS 페어 작업 완료 후 진행.

---

## 진행 추적

| Phase | 상태 | 담당 | 비고 |
|---|---|---|---|
| 0 사전 결정 | ⬜ | | 레포 형태 결정 필수 |
| 1 스캐폴드 | ⬜ | | |
| 2 invoke 골격 | ⬜ | | |
| 3 guardrails | ⬜ | | |
| 4 skills | ⬜ | | |
| 5 write-back | ⬜ | | BE-22 의존 |
| 6 cron tick | ⬜ | | BE-20/21 의존 |
| 7 streaming | ⬜ | P1 | |
| 8 관측 | ⬜ | P1 | |
| 9 모델 분기 | ⬜ | P1 | |
| 10 캐시 | ⬜ | P1 | |
| 11 공유 타입 | ⬜ | P1 | |
| 12 테스트/품질 | ⬜ | P2 | |

상태 표기: ⬜ todo / 🟡 doing / ✅ done / ⏸ blocked

---

## 해커톤 페이스 권장 순서 (시간 압박 시)

```
[Day 1 오전] Phase 0 → 1 (스캐폴드 + 첫 배포)
[Day 1 오후] Phase 2 → 3 (invoke + guardrail, NestJS mock)
[Day 2 오전] Phase 4 (skill 1개 + tool calling)
[Day 2 오후] Phase 5 → 6 (NestJS 연결, cron tick)
[여유 시간] Phase 7 (streaming) → 8 (관측)
```
