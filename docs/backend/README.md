# Backend Docs

NestJS + Prisma + Postgres 기반 MyClaw 백엔드. P0 도메인 (User, Profile, Agent, MemoryDocument, Skill, Greeting) + Vercel 서버리스 배포 + Jest e2e.

## 위치

- 코드: [`/backend`](../../backend)
- Production: <https://backend-kappa-brown-63.vercel.app>
- **인터랙티브 API 문서 (Swagger UI)**: <https://backend-kappa-brown-63.vercel.app/docs>
- OpenAPI JSON (코드 생성용): <https://backend-kappa-brown-63.vercel.app/docs-json>

## 문서

| 파일 | 설명 |
| ---- | ---- |
| [architecture.md](./architecture.md) | 디렉터리/모듈 구조, 핵심 파일 |
| [api.md](./api.md) | 엔드포인트 명세 + 예시 (프론트 연동용) |
| [deployment.md](./deployment.md) | Vercel + GitHub Actions 배포 파이프라인 |
| [local-dev.md](./local-dev.md) | 로컬 실행 / 빌드 / 디버깅 |
| [test/README.md](./test/README.md) | E2E 테스트 가이드 (Jest + supertest, 로컬 전용) |
| [todo.md](./todo.md) | `docs/plan` 기반 작업 todo (우선순위/의존관계 포함) |

## TL;DR

```bash
cd backend
docker compose up --build -d           # Postgres + backend 한 번에
curl http://localhost:3000/health       # {"status":"ok","db":"ok"}
open http://localhost:3000/docs         # Swagger UI
```

엔드포인트는 `/docs` Swagger UI 또는 [api.md](./api.md) 참고.

## 주의

- `MemoryDocument`(Postgres)는 plan의 llm-wiki 패턴(폴더-경로) 을 그대로 재현합니다. 폴더가 아닌 `(userId, path)` 복합 PK로 저장.
- 영속성은 Vercel Postgres / Neon에 위임. 로컬은 `docker compose` 의 `postgres:16-alpine`.
- 옛 mock `/items`는 BE-17 에서 제거 예정 (현재는 데모용으로 유지).
