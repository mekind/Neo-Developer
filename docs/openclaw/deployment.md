# Deployment

`aim-openclaw`는 **별도 Vercel 프로젝트**. `aim-backend`(NestJS)와 분리.

## 1. 프로젝트 셋업

```bash
# repo 생성 후
npx create-next-app@latest aim-openclaw \
  --ts --app --no-tailwind --src-dir --import-alias "@/*"
cd aim-openclaw
pnpm add ai zod @ai-sdk/gateway
pnpm add -D @types/node
```

UI 없음. App Router의 Route Handlers만 사용. `app/page.tsx`는 health 정보 정도만.

## 2. `vercel.ts` 설정

```ts
// vercel.ts
import { type VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  framework: 'nextjs',
  buildCommand: 'pnpm build',
  installCommand: 'pnpm install --frozen-lockfile',
  crons: [
    { path: '/api/tick', schedule: '*/5 * * * *' },
  ],
};
```

> 기존 `vercel.json`을 유지해도 동작은 동일. 신규 프로젝트는 `vercel.ts` 권장.

## 3. 환경 변수

| Key | 값/설명 | 환경 |
|---|---|---|
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway 키 | all |
| `BACKEND_BASE_URL` | NestJS 배포 URL (`https://aim-backend-...vercel.app`) | preview/prod 분리 |
| `BACKEND_SERVICE_TOKEN` | NestJS ↔ OpenClaw 서비스간 토큰 | all (값은 동일) |
| `CRON_SECRET` | Vercel Cron 인증 | all |
| `DEFAULT_MODEL` | 예: `anthropic/claude-haiku-4-5` | all |

```bash
vercel env add AI_GATEWAY_API_KEY
vercel env add BACKEND_BASE_URL
vercel env add BACKEND_SERVICE_TOKEN
vercel env add CRON_SECRET
vercel env add DEFAULT_MODEL
```

`.env.example`에 키 이름만 (값 없이) 커밋.

## 4. AI Gateway

- Vercel 프로젝트 → Storage/Integrations → AI Gateway 연결
- provider 추가 (Anthropic, OpenAI 등 — MVP는 Anthropic만)
- 모델 문자열은 `"anthropic/claude-haiku-4-5"` 형식으로 AI SDK에 전달
- ZDR(zero data retention) 옵션 권장

직접 provider 패키지(`@ai-sdk/anthropic`)는 사용하지 않음 — Gateway 통일.

## 5. 배포

```bash
vercel link              # 프로젝트 연결
vercel --prebuilt false  # 첫 배포 (preview)
vercel --prod            # 프로덕션
```

GitHub 연동 시 push만으로 자동 배포. `main` → production, 그 외 브랜치 → preview.

## 6. NestJS 측 연동 작업

NestJS(`aim-backend`)에 다음 env 추가:

| Key | 설명 |
|---|---|
| `OPENCLAW_BASE_URL` | OpenClaw 배포 URL |
| `BACKEND_SERVICE_TOKEN` | OpenClaw와 동일 값 |

NestJS에 신설 작업(BE 측 todo 추가 필요):

- [ ] `OpenclawClient` 모듈 (HTTP client)
- [ ] `POST /agents/:id/invoke` (proxy to OpenClaw, x-user-id auth)
- [ ] `GET /agents/due?at=...` (cron 보조)
- [ ] `POST /users/:id/notifications` (서비스 토큰 인증, OpenClaw 호출용)
- [ ] `POST /users/:id/log` (동일)

## 7. Cron 검증

```ts
// app/api/tick/route.ts
export async function POST(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('unauthorized', { status: 401 });
  }
  // ...
}
```

Vercel은 자체 Cron 호출 시 `CRON_SECRET`을 헤더로 자동 주입 (프로젝트 설정에 `CRON_SECRET` 등록 시).

## 8. 모니터링

| 도구 | 용도 |
|---|---|
| Vercel Logs | Route handler 로그, 에러 |
| AI Gateway 대시보드 | 모델별 호출/토큰/비용/에러율 |
| Vercel Cron 로그 | tick 성공/실패 |
| (P2) 외부 collector | Pino → Logflare 등 |

## 9. 롤백

- Vercel 대시보드 → Deployments → 이전 deployment "Promote to Production"
- 또는 `vercel rollback <deployment-url>`
- DB가 없는 stateless 서비스라 롤백 부작용 없음

## 10. Region

MVP는 단일 region (`iad1` 또는 NestJS와 동일). 응답 P50 < 2초 확인 후 multi-region 검토.
