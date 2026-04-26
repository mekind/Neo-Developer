# Local Development

## Prerequisites

- Node 20.13.1 (CI 기준 버전)
- npm 10.x

다른 버전을 쓰면 `package-lock.json`이 갱신되어 CI와 어긋날 수 있으니 가급적 동일 버전 사용.

## 설치 / 실행

```bash
cd backend
cp .env.example .env       # DATABASE_URL / DIRECT_URL 채우기 (Neon dev branch 또는 로컬 Postgres)
npm install                # postinstall에서 prisma generate 자동 실행
npx prisma migrate dev     # 첫 실행 시 (로컬 DB에 스키마 적용)
npm run start:dev          # watch 모드, http://localhost:3000
```

### Prisma 명령

| 명령 | 용도 |
|---|---|
| `npx prisma migrate dev --name <name>` | 스키마 변경 후 새 마이그레이션 생성 + 로컬 DB 적용 |
| `npx prisma migrate deploy` | 이미 만들어진 마이그레이션을 운영 DB에 적용 (CI에서 사용) |
| `npx prisma generate` | TypeScript 클라이언트 재생성 (`postinstall`로 자동) |
| `npx prisma studio` | 브라우저 GUI로 DB 들여다보기 |
| `npx prisma db push` | 마이그레이션 없이 스키마만 푸시 (스크래치 작업용, 운영 금지) |

### 로컬 DB 옵션

1. **Neon dev branch (권장)** — Vercel Postgres 가입 후 dev branch URL을 `.env`에 넣으면 끝.
2. **Docker Postgres (수동)** — `docker run -d --name myclaw-pg -e POSTGRES_PASSWORD=dev -p 5432:5432 postgres:16` 후 `DATABASE_URL="postgresql://postgres:dev@localhost:5432/postgres"`, `DIRECT_URL` 동일.
3. **Docker Compose (백엔드 + DB 한 번에)** — 아래 §Docker Compose 참조.

## Docker Compose (백엔드 + Postgres 통합 실행)

`backend/Dockerfile` + `backend/docker-compose.yml`로 백엔드와 Postgres를 컨테이너로 같이 띄울 수 있습니다. Node/npm 설치 없이 검증만 할 때 가장 빠릅니다.

```bash
cd backend
docker compose up --build -d            # 첫 실행: 이미지 빌드 + DB+백엔드 기동
docker compose logs -f backend          # 로그 확인 (Ctrl+C로 빠져나옴)

curl http://localhost:3000/health        # {"status":"ok","db":"ok",...}
curl http://localhost:3000/items         # mock 2건

docker compose down                      # 종료 (볼륨 유지)
docker compose down -v                   # 종료 + DB 데이터 삭제
```

동작:
- `backend` 컨테이너 부팅 시 `prisma migrate deploy`가 자동 실행되어 스키마 적용
- `postgres` 서비스가 `pg_isready` 헬스체크 통과 후 backend 시작
- DB 데이터는 `postgres-data` 볼륨에 영속화 (`down -v`로 삭제 가능)

호스트에서 DB 직접 접속:

```bash
psql postgresql://myclaw:myclaw@localhost:5432/myclaw
```

기타 스크립트 (`backend/package.json`):

| 명령 | 설명 |
|---|---|
| `npm run start` | 단발 실행 |
| `npm run start:dev` | watch 재시작 |
| `npm run start:prod` | `dist/main.js` 직접 실행 (사전 `npm run build` 필요) |
| `npm run build` | `nest build` → `dist/` 생성 |

## 포트 변경

```bash
PORT=3001 npm run start
```

`src/main.ts`가 `process.env.PORT`를 읽습니다.

## 빠른 헬스체크

```bash
curl -s http://localhost:3000/items | jq
```

엔드포인트 전체 명세는 [api.md](./api.md) 참조.

## E2E 테스트 (Jest + supertest)

`backend/test/*.e2e-spec.ts` 가 BE-02 ~ BE-06 흐름 31개를 검증합니다 (Postgres 필요).

```bash
cd backend
docker compose up postgres -d                # DB만 띄움
DATABASE_URL='postgresql://myclaw:myclaw@localhost:5432/myclaw?schema=public' \
DIRECT_URL='postgresql://myclaw:myclaw@localhost:5432/myclaw?schema=public' \
npm run test:e2e                             # pretest:e2e 가 prisma migrate deploy 자동 실행
```

테스트 스위트:

| 파일 | 검증 |
|---|---|
| `health.e2e-spec.ts` | `/health` + DB ping |
| `users.e2e-spec.ts` | BE-02: POST/GET 사용자, PATCH profile, 검증 400, 404 |
| `memory.e2e-spec.ts` | BE-03: PUT (frontmatter 자동 파싱), 인덱스, 단건 조회, log append 순서 |
| `agents.e2e-spec.ts` | BE-04: 3-에이전트 제한 (4번째 409), persona/SOUL/config 라운드트립, DELETE 후 슬롯 회복 |
| `skills.e2e-spec.ts` | BE-05: 시드 카탈로그 5종, `insane-search` 메타데이터 |
| `greetings.e2e-spec.ts` | BE-06: alert/approach 랜덤 픽, 빈 배열 → null, 잘못된 type 400 |

CI: `.github/workflows/test-backend.yml` 가 PR/push 시 GitHub Actions 환경에서 Postgres service container를 띄워 자동 실행합니다.

## 데이터 초기화

서버를 재시작하면 `ItemsService`의 인메모리 배열이 초기 mock 2건으로 리셋됩니다 (`src/items/items.service.ts`).

## Vercel 환경 흉내내어 로컬 실행

`api/index.ts`를 직접 돌려보고 싶다면 Vercel CLI의 dev:

```bash
cd backend
npx vercel@latest dev      # http://localhost:3000 (Vercel 라우팅 시뮬레이션)
```

이 경우 `vercel.json`의 routes를 거쳐 `api/index.ts`가 호출되어 프로덕션 동작과 같은 경로로 검증할 수 있습니다.

## 디버깅

VS Code 기준 `.vscode/launch.json` 예:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Nest Debug",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "start:debug"],
      "cwd": "${workspaceFolder}/backend",
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

`start:debug` 스크립트가 없다면 추가:

```json
"start:debug": "nest start --debug --watch"
```

## 자주 겪는 이슈

| 증상 | 해결 |
|---|---|
| `EADDRINUSE: address already in use :::3000` | `lsof -i :3000`로 PID 확인 후 종료, 또는 `PORT=3001` 사용 |
| `class-validator` 데코레이터가 무시됨 | `tsconfig.json`의 `experimentalDecorators`, `emitDecoratorMetadata`가 `true`인지 확인 |
| `nest: command not found` | `npx nest ...` 또는 `npm install` 누락 |
| TypeScript strict 에러 | 코드 수정 권장. 우회는 `tsconfig.json`의 `strictNullChecks` 끄지 말고 개별 케이스 명시 처리 |

## 코드 추가 시

새 리소스 추가 패턴 (예: `users`):

```bash
cd backend
npx nest g resource users --no-spec
# REST API + CRUD + DTO 자동 스캐폴드
```

새 모듈은 `src/app.module.ts`의 `imports` 배열에 자동 등록됩니다.
