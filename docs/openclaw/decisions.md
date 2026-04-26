# Decisions

## D-01: 별도 레포 / 별도 Vercel 프로젝트

**선택**: `aim-openclaw` 별도 레포, 별도 Vercel 프로젝트.

| 대안 | 채택 안 함 사유 |
|---|---|
| Monorepo (next-forge) | 빌드/배포 lifecycle 묶이고 LLM 의존성이 백엔드 빌드에 섞임 |
| NestJS 안에 통합 | 책임 혼재, NestJS는 데이터 책임만 유지하는 게 plan 의도와 일치 |

**트레이드오프**: 타입 공유 비용 → 공통 타입은 `shared/contracts.ts`를 양 레포에 복제 또는 npm package로 추출 (P1).

---

## D-02: Next.js App Router (Route Handlers)

**선택**: Next.js App Router.

| 대안 | 채택 안 함 사유 |
|---|---|
| Hono on Vercel | 가볍지만 AI SDK/Gateway/Cron 통합 예시는 Next 우선, 해커톤 자료 풍부함이 우선 |
| Express on Vercel | Functions로 가능하나 framework preset이 약함 |
| NestJS 추가 인스턴스 | 무거움, LLM 워크로드와 안 맞음 |

---

## D-03: Vercel AI Gateway + AI SDK v6

**선택**: provider 추상화 통일.

| 장점 | 단점 |
|---|---|
| provider 변경/추가 코드 변경 최소 | Gateway 자체 의존 |
| 관측·비용·fallback 한 곳 | 직접 provider 호출 대비 미세한 latency |
| ZDR 옵션 | 무료 tier 한계는 별도 확인 필요 |

직접 provider 패키지(`@ai-sdk/anthropic` 등)는 사용 안 함 — `gateway('provider/model')` 통일.

---

## D-04: Stateless 런타임 — 모든 상태는 NestJS

**선택**: OpenClaw는 어떤 상태도 보관 안 함 (메모리/세션 X).

이유:
- Vercel Functions는 인스턴스 휘발 — stateful 가정 위험
- plan에서 Memory가 명시적으로 NestJS 책임
- 디버깅/롤백 단순 (코드만 롤백하면 끝)

---

## D-05: Skill 실행 = 내부 함수 (Sandbox 아님)

**선택**: `inline` runtime.

비교는 `architecture.md` 또는 별도 표 참고. 요약:

| 축 | inline | Sandbox |
|---|---|---|
| 레이턴시 | ✅ ~0ms 오버헤드 | ❌ 부팅 수백ms~ |
| 비용 | ✅ Function 1회 | ❌ Function + Sandbox |
| 격리 | ❌ 같은 프로세스 | ✅ microVM |
| 신뢰 모델 적합 | ✅ 우리가 짠 코드 | ❌ 과한 격리 |
| 외부 binary 필요 | ⚠️ bundle 의존 | ✅ apt/pip 자유 |
| 개발 속도 | ✅ import만 하면 됨 | ❌ IPC 경계 |

**결정 근거**: plan에서 Skill은 사전 정의 목록이며 사용자 코드 실행 안 함. inline이 모든 면에서 유리.

**확장성**: registry에 `runtime: 'inline' | 'sandbox'` 필드를 미리 두어, 사용자 정의 skill 도입 시 점진 마이그레이션 가능.

---

## D-06: 알림 = NestJS notifications 리소스에 PUT

**선택**: OpenClaw는 직접 채널 발송 안 함.

| 대안 | 채택 안 함 사유 |
|---|---|
| OpenClaw에서 Discord/Slack 직접 호출 | 채널 관리/시크릿이 백엔드와 이중화됨 |
| Frontend 폴링만 | 알림 영속성 없음, 재방문 시 손실 |

**구조**: OpenClaw가 본문 생성 → NestJS `POST /users/:id/notifications` → 프론트 폴링/SSE.

`greetings_alert` static random pick은 NestJS BE-06이 렌더 시점에 합성. OpenClaw는 그 부분에 LLM 비용 안 씀.

---

## D-07: 인증 — 서비스 토큰 (MVP)

**선택**: 양 서비스 공유 Bearer 토큰.

| 대안 | 채택 안 함 사유 |
|---|---|
| OIDC service-to-service | 셋업 비용 큼, MVP에 과함 |
| mTLS | Vercel에서 셋업 복잡 |
| 무인증 | 명백히 안 됨 |

**한계**: 토큰 유출 시 권한 분리 안 됨. 추후 분리 권장.

---

## D-08: Cron — Vercel Cron Jobs

**선택**: Vercel 내장 Cron.

| 장점 | 단점 |
|---|---|
| 셋업 1줄 (`vercel.ts`) | 분 단위 정밀도 |
| Cron 인증 자동 (`CRON_SECRET`) | 같은 region에서만 발화 |
| 비용 통합 | 외부 스케줄 의존성 만들고 싶지 않음 |

장기 작업(>5분)은 별도 처리 필요 — Vercel Workflow/Queue 도입 시점에 재검토.

---

## D-09: 응답 모드 — generateText 우선, streaming은 P1

**선택**: 우선 비스트리밍.

이유:
- NestJS 프록시 경유라 streaming 추가 작업이 양쪽 다 필요
- MVP 검증엔 generateText로 충분
- OC-07에서 `streamText`로 전환 (UX 가시 효과 큼)

---

## D-10: Memory Snapshot은 Request에 포함

**선택**: NestJS가 SOUL/config/memory를 invoke 요청 body에 묶어서 전달.

| 대안 | 채택 안 함 사유 |
|---|---|
| OpenClaw가 NestJS에 추가 호출 | 왕복 1회 추가 → latency |
| OpenClaw가 캐싱 | stateless 원칙 위배 |

**결과**: invoke 1회 = NestJS→OpenClaw 1회 + OpenClaw→LLM 1회 (+ tool roundtrip).

---

## 미해결 (추후 결정)

| 항목 | 영향 |
|---|---|
| 공유 타입 패키지 추출 시점 | 두 레포 타입 drift 위험 vs 패키지 발행 비용 |
| streaming 도입 시점 | UX vs 양쪽 코드 변경 |
| Sandbox 도입 트리거 | "사용자 정의 skill" 요건 등장 시 |
| multi-region | P50/P99 측정 후 |
| 모델 분기 | 빠른 응답용 Haiku, 복잡 추론 Sonnet — 자동 라우팅 룰 |
