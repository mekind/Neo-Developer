# API Contract

OpenClaw는 외부에 HTTP API 3개만 노출. 모든 응답은 JSON. 모든 시간은 ISO 8601.

## 인증

| 경로 | 필요 헤더 |
|---|---|
| `POST /api/invoke` | `Authorization: Bearer ${BACKEND_SERVICE_TOKEN}` |
| `POST /api/tick` | `Authorization: Bearer ${CRON_SECRET}` |
| `GET /api/health` | (없음) |

토큰 불일치 → `401`.

---

## `POST /api/invoke`

사용자 발화 한 건 처리. NestJS 백엔드가 호출.

### Request

```json
{
  "user_id": "u_abc123",
  "agent_id": "a_news_001",
  "input": "오늘 뭐 새로운 거 있어?",
  "trigger": "message",          // "message" | "approach"
  "context": {
    "soul": { "...": "SOUL.md frontmatter + 본문 파싱 결과" },
    "config": { "...": "config.md 파싱 결과" },
    "memory_snapshot": {
      "profile": { "name": "수진", "purpose": "..." },
      "preferences": { "tone": "friendly", "formality": "반말" },
      "interests": ["마케팅", "트렌드"],
      "recent_history": [
        { "ts": "2026-04-26T08:00:00Z", "event": "..." }
      ]
    }
  }
}
```

NestJS가 **이미 SOUL/config/memory를 묶어서 전달**하는 모델. OpenClaw가 NestJS를 다시 호출하지 않아도 한 번에 응답 가능.

### Response (200)

```json
{
  "reply": "오 안녕! 오늘 A사 블로그에 새 글 하나 올라왔어. ...",
  "used_skills": ["insane-search"],
  "tokens": { "input": 1234, "output": 256 },
  "refused": null
}
```

### Refused (200, 거절도 정상 응답)

```json
{
  "reply": "그건 내 전문이 아니야 😅",
  "used_skills": [],
  "refused": { "reason": "out_of_scope" }
}
```

`reason`: `"out_of_scope"` | `"boundary_violation"` | `"safety"`

### Errors

| 코드 | 의미 |
|---|---|
| 400 | 스키마 위반 (zod 검증 실패) |
| 401 | 토큰 불일치 |
| 422 | SOUL/config 파싱 불가 |
| 500 | LLM/Skill 호출 실패 |
| 504 | LLM timeout |

---

## `POST /api/tick`

Vercel Cron 트리거. 만기 도달한 에이전트들의 알림을 처리.

### Request

```json
{
  "now": "2026-04-26T08:00:00Z"
}
```

### 처리 흐름

1. NestJS에 `GET /agents/due?at=${now}` 호출 → 만기 에이전트 목록
2. 각 에이전트에 대해:
   - SOUL/config/memory 페치
   - config.schedule.action 실행 (e.g. insane-search)
   - 결과 요약 (LLM)
   - NestJS에 `POST /users/:id/notifications` (kind=alert)
3. 집계 응답

### Response (200)

```json
{
  "processed": 12,
  "succeeded": 11,
  "failed": [
    { "agent_id": "a_xxx", "error": "skill_timeout" }
  ],
  "duration_ms": 3450
}
```

알림 자체에 들어갈 인사말(`greetings_alert` random pick)은 NestJS BE-06이 클라이언트 노출 시점에 결정. OpenClaw는 본문만 생성.

---

## `GET /api/health`

```json
{
  "ok": true,
  "version": "0.1.0",
  "uptime_s": 1234,
  "checks": {
    "ai_gateway": "ok",
    "backend": "ok"
  }
}
```

`backend`는 NestJS `/health` ping 결과. 실패해도 200 (ok=false)으로 내려서 Vercel 헬스체크가 misleading하지 않게 함.

---

## NestJS 측에 필요한 신규 엔드포인트 (OpenClaw 호출용)

OpenClaw → NestJS 호출에서 쓰이는 것 정리. (NestJS BE 작업 항목으로도 등록 필요)

| 메서드 | 경로 | 용도 |
|---|---|---|
| `GET` | `/agents/due?at=${iso}` | 만기 에이전트 목록 |
| `POST` | `/users/:id/notifications` | 알림 저장 (kind, body, agentId) |
| `POST` | `/users/:id/log` | 활동 로그 append |
| `PUT` | `/users/:id/memory/:path` | (필요 시) Memory 갱신 |

위 호출들은 모두 `BACKEND_SERVICE_TOKEN`으로 인증.

---

## 스키마 (TypeScript)

```ts
// shared types — 추후 별도 패키지 또는 OpenAPI로 동기화
export type InvokeRequest = {
  user_id: string;
  agent_id: string;
  input: string;
  trigger: 'message' | 'approach';
  context: {
    soul: SoulDoc;
    config: ConfigDoc;
    memory_snapshot: MemorySnapshot;
  };
};

export type InvokeResponse = {
  reply: string;
  used_skills: string[];
  tokens: { input: number; output: number };
  refused: { reason: 'out_of_scope' | 'boundary_violation' | 'safety' } | null;
};

export type TickRequest = { now: string };

export type TickResponse = {
  processed: number;
  succeeded: number;
  failed: { agent_id: string; error: string }[];
  duration_ms: number;
};
```
