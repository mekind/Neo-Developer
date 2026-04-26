# OpenClaw — MyClaw Agent Runtime

MyClaw 에이전트 런타임. **자체 구현**이며, 기존 OpenClaw 프로젝트를 가져다 쓰는 것이 아님.

## 한 줄 정의

> SOUL.md를 시스템 프롬프트로, Skill을 tool로 매핑해서 LLM 호출을 수행하는 **stateless HTTP 런타임**.

## 위치

모든 컴포넌트는 `Neo-Developer` 모노레포 안. Vercel 프로젝트는 컴포넌트별로 분리.

| 컴포넌트 | 경로 | 배포 |
|---|---|---|
| Frontend | `AIM/FE/` | Vercel (root = `AIM/FE`) |
| Backend (NestJS) | `AIM/backend/` | Vercel (root = `AIM/backend`) |
| **OpenClaw** | **`AIM/openclaw/`** | **Vercel (root = `AIM/openclaw`, 별도 프로젝트)** |

## 책임

- 사용자 발화 또는 cron tick → SOUL/config/Memory 컨텍스트 로드 → LLM 호출 → 응답
- Skill(=tool) 실행 (insane-search 등)
- Boundaries / out-of-scope 가드레일
- 알림 산출물을 NestJS notifications 리소스에 PUT
- **상태는 들지 않음** — 모든 영속 상태는 NestJS 백엔드(Postgres)

## 책임 아닌 것

- 사용자/에이전트 데이터 영속화 (NestJS 담당)
- 온보딩/Persona Builder (별도 Claude 세션)
- 인사말 random pick — `BE-06` (NestJS) 담당. OpenClaw는 응답 본문만 생성
- 직접적인 채널 발송 (Discord/Slack 등) — MVP는 NestJS notifications 리소스에 위임

## 문서 인덱스

- [architecture.md](./architecture.md) — 시스템 구조, 컴포넌트, 데이터 흐름
- [api.md](./api.md) — `/invoke`, `/tick` 등 HTTP 계약
- [skills.md](./skills.md) — Skill registry 모델, 작성 가이드
- [runtime.md](./runtime.md) — SOUL → 시스템 프롬프트 빌드, 가드레일, 호출 파이프라인
- [deployment.md](./deployment.md) — Vercel 프로젝트 셋업, env, cron, AI Gateway
- [local-dev.md](./local-dev.md) — 로컬 실행, NestJS와 연동
- [decisions.md](./decisions.md) — 핵심 결정 사항 + 트레이드오프
- [todo.md](./todo.md) — 작업 목록 (OC-01 ~)
- [checklist.md](./checklist.md) — Phase 0~12 실행 체크리스트
- [setup-guide.md](./setup-guide.md) — Phase 0 외부 셋업(Vercel/AI Gateway/Token) 절차

## 핵심 결정 요약

| 항목 | 선택 |
|---|---|
| 코드 위치 | `Neo-Developer` monorepo의 `AIM/openclaw/` 폴더 |
| 배포 | 별도 Vercel 프로젝트 (root directory = `AIM/openclaw`) |
| 런타임 | Next.js App Router (Route Handlers) |
| 컴퓨트 | Vercel Fluid Compute |
| LLM 게이트웨이 | Vercel AI Gateway + AI SDK v6 |
| Skill 실행 | **내부 함수** (Sandbox 아님) |
| 상태 | stateless — 모든 상태는 NestJS Postgres |
| 알림 | NestJS notifications 리소스에 PUT |
| Cron | Vercel Cron Jobs → `/api/tick` |
| 인증(서비스간) | `BACKEND_SERVICE_TOKEN` (Bearer) |
| 인증(cron) | `CRON_SECRET` 헤더 |

상세 비교는 [decisions.md](./decisions.md) 참고.
