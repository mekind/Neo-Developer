# Backend (NestJS + Prisma + Postgres)

MyClaw 백엔드 — 사용자/에이전트/Memory 영속화 + 사전 정의 Skill 카탈로그 + 인사말 랜덤 픽 등 P0 기능을 NestJS + Prisma 위에서 제공.

상세 문서:

- [docs/backend/README.md](../docs/backend/README.md) — 전체 인덱스
- [docs/backend/architecture.md](../docs/backend/architecture.md) — 모듈/스키마
- [docs/backend/api.md](../docs/backend/api.md) — 엔드포인트 + 예시 (`/docs` Swagger UI 안내 포함)
- [docs/backend/local-dev.md](../docs/backend/local-dev.md) — 로컬 실행 / docker compose / Prisma 명령
- [docs/backend/test/README.md](../docs/backend/test/README.md) — Jest e2e

## 설치 / 실행

```bash
cp .env.example .env                 # DATABASE_URL, DIRECT_URL 설정
npm install                          # postinstall 에서 prisma generate 자동
npx prisma migrate dev               # 첫 실행 시 로컬 DB 스키마 적용
npm run start:dev                    # http://localhost:3000
```

또는 docker compose 로 백엔드 + Postgres 한 번에:

```bash
docker compose up --build -d         # /health 가 db:ok 까지 헬스 체크 후 백엔드 기동
```

## 엔드포인트 한 눈에

| Method | Path                                                    | 설명                                          |
| ------ | ------------------------------------------------------- | --------------------------------------------- |
| GET    | `/health`                                               | 서비스 상태 + DB ping                         |
| GET    | `/docs`                                                 | Swagger UI                                    |
| GET    | `/docs-json`                                            | OpenAPI 3 spec (코드 생성용)                  |
| ANY    | `/items[/:id]`                                          | mock CRUD (BE-17 에서 제거 예정)              |
| POST   | `/users`                                                | 익명 사용자 생성                              |
| GET    | `/users/:id`                                            | 사용자 + 프로필                               |
| PATCH  | `/users/:id/profile`                                    | 닉네임/목적/기술수준 upsert                   |
| GET    | `/users/:userId/memory`                                 | Memory 인덱스                                 |
| GET    | `/users/:userId/memory/*`                               | 단일 Memory 문서                              |
| PUT    | `/users/:userId/memory/*`                               | Memory upsert                                 |
| POST   | `/users/:userId/log`                                    | 활동 로그 prepend                             |
| GET    | `/users/:userId/agents`                                 | 에이전트 목록 (≤3 보장)                       |
| POST   | `/users/:userId/agents`                                 | 에이전트 생성 (4번째 → 409)                   |
| GET    | `/users/:userId/agents/:agentId`                        | 에이전트 + persona/SOUL/config                |
| PATCH  | `/users/:userId/agents/:agentId`                        | 부분 수정                                     |
| DELETE | `/users/:userId/agents/:agentId`                        | 삭제 (관련 Memory 문서까지 정리)              |
| GET    | `/users/:userId/agents/:agentId/greeting?type=alert\|approach` | SOUL 기반 정적 랜덤 픽 (LLM 호출 없음) |
| GET    | `/skills`                                               | Skill 카탈로그                                |

### 빠른 호출 예시

```bash
curl http://localhost:3000/health
curl -X POST http://localhost:3000/users -H 'Content-Type: application/json' -d '{}'
curl http://localhost:3000/skills
```

전체 명세는 `http://localhost:3000/docs` 의 Swagger UI 에서 직접 시험해볼 수 있습니다.
