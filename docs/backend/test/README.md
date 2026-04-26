# Backend Tests

Jest + supertest 기반 e2e 테스트만 둡니다 (단위 테스트는 아직 없음).

> CI 워크플로우는 의도적으로 추가하지 않았습니다 — **로컬에서만** 실행합니다.

## 빠른 실행

```bash
cd backend
docker compose up postgres -d                   # DB만 띄움 (백엔드 컨테이너는 띄울 필요 없음)
DATABASE_URL='postgresql://myclaw:myclaw@localhost:5432/myclaw?schema=public' \
DIRECT_URL='postgresql://myclaw:myclaw@localhost:5432/myclaw?schema=public' \
npm run test:e2e
```

`pretest:e2e` 가 `prisma migrate deploy` 를 자동 실행해 스키마를 보장합니다.

## 디렉터리

```
backend/test/
├── jest-e2e.json                # ts-jest 설정 (testRegex: .e2e-spec.ts$)
├── utils/
│   └── test-app.ts              # AppModule + ValidationPipe 부트 헬퍼
├── health.e2e-spec.ts
├── users.e2e-spec.ts
├── memory.e2e-spec.ts
├── agents.e2e-spec.ts
├── skills.e2e-spec.ts
└── greetings.e2e-spec.ts
```

## 스위트별 커버리지

| 파일 | 대상 | 검증 포인트 |
|---|---|---|
| `health.e2e-spec.ts` | `/health` | status=ok, db ping |
| `users.e2e-spec.ts` | BE-02 | POST/GET 사용자, PATCH profile, 검증 400 (techLevel/empty nickname), 404 |
| `memory.e2e-spec.ts` | BE-03 | PUT 시 frontmatter 자동 파싱(gray-matter) vs 명시 제공, 인덱스, 단건 조회, log append 순서, 404 |
| `agents.e2e-spec.ts` | BE-04 | 3-에이전트 제한 (4번째 409), persona/SOUL/config 라운드트립, PATCH 부분 갱신, DELETE 후 슬롯 회복, 검증 400 |
| `skills.e2e-spec.ts` | BE-05 | 부팅 시 5개 시드, `insane-search` 메타데이터(triggers, defaultParams) |
| `greetings.e2e-spec.ts` | BE-06 | alert/approach 랜덤 픽, 다중 호출 시 분포 다양성, 빈 배열 → text:null, 잘못된 type 400, unknown agent 404 |

총 31 테스트, 로컬 실행 시 ~6초.

## 실행 흐름

`backend/test/utils/test-app.ts` 가 매 스위트마다 `Test.createTestingModule({ imports: [AppModule] })` 로 NestJS 풀 부트 → `useGlobalPipes(ValidationPipe)` 적용 → `app.init()` 까지 진행. supertest는 `app.getHttpServer()` 로 직접 요청.

각 스위트는 `beforeAll` 에서 자체 user를 새로 만들어 사용 → 스위트 간 격리. cleanup 은 별도 안 함 (사용자가 `docker compose down -v` 로 일괄).

## 흔한 실패 케이스

| 증상 | 원인 / 해결 |
|---|---|
| `Can't reach database server at localhost:5432` | `docker compose up postgres -d` 누락 또는 다른 포트 사용 — `docker ps` 로 myclaw-postgres 확인 |
| `migration_lock.toml provider mismatch` | 외부 DB(Neon 등) 가리키고 있음 — `DATABASE_URL` 다시 확인 |
| 테스트가 첫 실행 시 느림 (~10s+) | Prisma client 컴파일 / Nest DI 초기화 — 이후 실행은 ~6s 수준 |
| `Skill catalog seed skipped` 워닝 | `SkillsService.onModuleInit` 가 DB 미접속 시 부팅 차단을 안 하도록 의도된 동작 — 테스트가 실제로 도는 동안에는 안 떠야 정상 |

## 새 스위트 추가 패턴

```ts
// backend/test/<feature>.e2e-spec.ts
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app';

describe('<Feature>', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('does the thing', async () => {
    const res = await request(app.getHttpServer())
      .get('/some-path')
      .expect(200);
    expect(res.body).toMatchObject({ ok: true });
  });
});
```

DB 상태가 필요하면 `beforeAll` 에서 `POST /users` 로 user 생성 후 그 id를 모든 케이스에서 재사용.
