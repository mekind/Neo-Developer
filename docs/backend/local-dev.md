# Local Development

## Prerequisites

- Node 20.13.1 (CI 기준 버전)
- npm 10.x

다른 버전을 쓰면 `package-lock.json`이 갱신되어 CI와 어긋날 수 있으니 가급적 동일 버전 사용.

## 설치 / 실행

```bash
cd backend
npm install
npm run start:dev          # watch 모드, http://localhost:3000
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
