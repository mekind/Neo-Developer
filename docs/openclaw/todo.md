# OpenClaw TODO

`aim-openclaw` 레포 신규 작업 목록. 우선순위는 plan 04 §6 MVP 기준.

> 현재 상태: 레포 미생성. 본 문서는 작업 정의만.

## 의존 관계

```
OC-01 (스캐폴드) ─▶ OC-02 (invoke 골격) ─▶ OC-03 (guardrail) ─▶ OC-04 (skill registry)
                                                                  │
                                                                  ▼
                                       OC-05 (write-back) ─▶ OC-06 (cron tick)
                                                                  │
                                                                  ▼
                                                    OC-07 (streaming) / OC-08 (관측)
```

NestJS(aim-backend) 측 페어 작업이 필요한 항목은 `[BE-paired]`로 표기.

---

## P0 — MVP

### [OC-01] 스캐폴드 + Vercel 프로젝트 셋업
- [ ] GitHub repo `aim-openclaw` 생성
- [ ] `create-next-app --ts --app --no-tailwind --src-dir`
- [ ] `pnpm add ai zod @ai-sdk/gateway`
- [ ] `vercel.ts` (framework, crons placeholder)
- [ ] `.env.example`
- [ ] `app/api/health/route.ts`
- [ ] `vercel link` + env 등록 (AI_GATEWAY_API_KEY, BACKEND_BASE_URL, BACKEND_SERVICE_TOKEN, CRON_SECRET, DEFAULT_MODEL)
- [ ] 첫 preview 배포 성공
- AC: `GET /api/health` 200

### [OC-02] `POST /api/invoke` 골격
- [ ] zod 스키마 (`InvokeRequest`)
- [ ] 토큰 검증 미들웨어
- [ ] `runtime/build-system-prompt.ts`
- [ ] `runtime/run.ts` — `generateText` 호출 (skill 없이)
- [ ] 응답 변환 (`InvokeResponse`)
- AC: SOUL/memory만 가지고 평문 대화 가능

### [OC-03] Guardrails (pre-LLM 거절)
- [ ] `runtime/guardrails.ts`
- [ ] boundaries 매칭 (단어/패턴 기반 MVP)
- [ ] out-of-scope 응답 템플릿 (formality 분기)
- [ ] `refused.reason` 응답 필드 채우기
- AC: plan VC-05, VC-07 통과

### [OC-04] Skill registry + `insane-search`
- [ ] `src/skills/index.ts` (registry)
- [ ] `src/skills/insane-search.ts` (zod schema + execute)
- [ ] AI SDK `tool()` 변환 헬퍼
- [ ] `runtime/select-skills.ts` (config.md → enabled tools)
- [ ] `maxToolRoundtrips` 설정
- AC: "오늘 뉴스 뭐 있어?" → tool 호출 → 응답

### [OC-05] Write-back to NestJS
- [ ] `clients/backend.ts` (HTTP client, 서비스 토큰)
- [ ] `runtime/write-back.ts` (history append)
- [ ] 실패 무시(allSettled) — 응답은 이미 사용자에게 갔음
- [ ] `[BE-paired]` NestJS `POST /users/:id/log` 보장
- AC: invoke 후 NestJS log에 이벤트 추가됨

### [OC-06] `POST /api/tick` (Cron)
- [ ] CRON_SECRET 검증
- [ ] `[BE-paired]` NestJS `GET /agents/due?at=...` 신설
- [ ] 만기 에이전트 병렬 처리 (Promise.allSettled, 동시성 제한)
- [ ] skill 실행 → 본문 생성
- [ ] `[BE-paired]` NestJS `POST /users/:id/notifications` (kind=alert) 호출
- [ ] `vercel.ts` crons 항목 추가 (`*/5 * * * *`)
- AC: plan VC-08 (스케줄 도달 시 알림 생성)

---

## P1 — Nice to Have

### [OC-07] Streaming 응답
- [ ] `streamText`로 전환
- [ ] NestJS proxy도 stream 통과 가능하게 (별도 BE 작업)

### [OC-08] 관측
- [ ] Pino 또는 console.json 구조화 로그
- [ ] `evt: invoke`, `evt: tick` 표준 필드
- [ ] AI Gateway 대시보드 연동 확인

### [OC-09] 모델 자동 분기
- [ ] SOUL `model` 필드 우선
- [ ] 복잡도 추정 → Haiku/Sonnet 선택 룰 (간단 휴리스틱)

### [OC-10] 캐시
- [ ] Vercel Runtime Cache API로 skill 결과 캐시 (e.g. 같은 검색 쿼리)

### [OC-11] 공유 타입 패키지
- [ ] `@aim/contracts` npm 또는 git submodule
- [ ] OpenClaw + NestJS 양쪽 import

---

## P2 — 운영/품질

### [OC-12] e2e 테스트
- [ ] vitest + supertest
- [ ] plan VC-05/06/07/08 시나리오

### [OC-13] 부하 테스트
- [ ] k6 또는 Artillery
- [ ] P50/P99 측정, region 결정 자료

### [OC-14] 비용 모니터링
- [ ] AI Gateway 일일 토큰 한도 알림
- [ ] 비정상 호출 패턴 검출 (1 user × 10000 invokes 등)

---

## NestJS(aim-backend) 측 페어 작업 (별도 등록 필요)

본 문서가 가정하는 NestJS 신규 엔드포인트:

- [ ] `POST /agents/:agentId/invoke` (frontend → NestJS → OpenClaw proxy, x-user-id auth)
- [ ] `GET /agents/due?at=${iso}` (cron 보조)
- [ ] `POST /users/:id/notifications` (서비스 토큰 인증)
- [ ] `POST /users/:id/log` (서비스 토큰 인증)
- [ ] `OpenclawClient` 모듈 (HTTP client, BACKEND_SERVICE_TOKEN)

위 항목은 `docs/backend/todo.md`에 BE-18 ~ BE-22로 추가 권장.

---

## 검토 필요

- [ ] OC-01 첫 배포 후 `BACKEND_BASE_URL`/`OPENCLAW_BASE_URL` 양쪽 등록 흐름
- [ ] 공유 타입 동기화 시점 (drift 발생 직전)
- [ ] AI Gateway plan/한도 확인
