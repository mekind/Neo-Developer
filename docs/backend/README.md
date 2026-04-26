# Backend Docs

NestJS 기반 mock CRUD 백엔드. DB 없이 인메모리 데이터로 동작합니다.

## 위치

- 코드: [`/backend`](../../backend)
- Production: <https://backend-kappa-brown-63.vercel.app>

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
npm install
npm run start:dev      # http://localhost:3000
```

엔드포인트:

```
GET    /items
GET    /items/:id
POST   /items
PATCH  /items/:id
DELETE /items/:id
```

## 주의

- 데이터는 서버리스 인스턴스의 **인메모리** 상태입니다. 영속성 없음 — 인스턴스가 새로 뜨면 mock 2건으로 리셋됩니다.
- 프로덕션 영속성이 필요해지면 Vercel KV/Postgres/Upstash 등 외부 스토어 도입 필요.
