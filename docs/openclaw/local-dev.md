# Local Development

`aim-openclaw`만 단독으로 띄우는 경우와, NestJS와 같이 띄우는 경우 둘 다 다룸.

## 1. 사전 준비

- Node 20+ 또는 22+ (Vercel default = Node 24 LTS, 로컬은 22 권장)
- pnpm 9+
- Vercel CLI: `npm i -g vercel`
- (선택) `vercel link`로 미리 프로젝트 연결

## 2. 환경 변수

`.env.local` 생성:

```
AI_GATEWAY_API_KEY=...
BACKEND_BASE_URL=http://localhost:3000
BACKEND_SERVICE_TOKEN=dev-shared-token
CRON_SECRET=dev-cron-secret
DEFAULT_MODEL=anthropic/claude-haiku-4-5
```

또는 `vercel env pull .env.local`로 dev 환경 변수 동기화.

## 3. 실행

```bash
pnpm install
pnpm dev   # next dev (포트 3001 권장 — NestJS와 충돌 회피)
```

`package.json`:

```json
{
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001"
  }
}
```

## 4. 헬스체크

```bash
curl http://localhost:3001/api/health
```

## 5. invoke 테스트

```bash
curl -X POST http://localhost:3001/api/invoke \
  -H "Authorization: Bearer dev-shared-token" \
  -H "Content-Type: application/json" \
  -d @fixtures/invoke.example.json
```

`fixtures/invoke.example.json` 예시:

```json
{
  "user_id": "u_dev",
  "agent_id": "a_news_001",
  "input": "오늘 새로운 거 있어?",
  "trigger": "message",
  "context": {
    "soul": {
      "identity": "당신은 뉴스봇입니다...",
      "personality": { "tone": "friendly", "formality": "반말", "verbosity": "concise", "language": "Korean" },
      "behavior_rules": ["새 소식이 있으면 핵심만 요약"],
      "boundaries": ["정치적 의견 금지"],
      "model": "anthropic/claude-haiku-4-5"
    },
    "config": {
      "skills": [
        { "id": "insane-search", "enabled": true, "triggers": ["새 글", "검색"] }
      ]
    },
    "memory_snapshot": {
      "profile": { "name": "수진", "purpose": "마케팅 자동화" },
      "preferences": { "tone": "friendly", "formality": "반말" },
      "interests": ["마케팅", "트렌드"],
      "recent_history": []
    }
  }
}
```

## 6. NestJS와 함께 띄우기

| 서비스 | 포트 |
|---|---|
| Frontend | 3002 (또는 5173) |
| NestJS | 3000 |
| OpenClaw | 3001 |

NestJS의 `OPENCLAW_BASE_URL=http://localhost:3001`, OpenClaw의 `BACKEND_BASE_URL=http://localhost:3000`. `BACKEND_SERVICE_TOKEN`은 양쪽 동일.

## 7. Cron 수동 트리거

```bash
curl -X POST http://localhost:3001/api/tick \
  -H "Authorization: Bearer dev-cron-secret" \
  -H "Content-Type: application/json" \
  -d '{"now":"2026-04-26T08:00:00Z"}'
```

## 8. AI Gateway 키 없이 개발

`DEFAULT_MODEL`을 mock 어댑터로 갈음:

```ts
// src/clients/ai.ts
export const model = process.env.AI_GATEWAY_API_KEY
  ? gateway(process.env.DEFAULT_MODEL!)
  : mockModel();  // 고정 응답 반환하는 어댑터
```

해커톤 초반엔 mock으로 파이프라인부터 깔고, 나중에 실 키 연결.

## 9. 흔한 문제

| 증상 | 원인/해결 |
|---|---|
| 401 unauthorized | `BACKEND_SERVICE_TOKEN` 양쪽 일치 확인 |
| `fetch failed` | `BACKEND_BASE_URL`이 컨테이너/IP 안 맞음 — `host.docker.internal` 등 |
| LLM 응답 없음 | AI Gateway 키 또는 모델 문자열 오타 |
| Cron이 로컬에서 안 돔 | Vercel Cron은 배포 후 동작. 로컬은 `curl`로 수동 |
