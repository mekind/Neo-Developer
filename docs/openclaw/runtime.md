# Runtime Pipeline

`POST /api/invoke` 핸들러가 거치는 6단계 파이프라인.

## 0. 진입

```
Route Handler (app/api/invoke/route.ts)
  └─ zod parse → InvokeRequest
  └─ token 검증
  └─ runPipeline(req)
```

## 1. load-agent

NestJS 백엔드가 SOUL/config/memory를 Request body에 이미 포함시켜 보냄. 따라서 OpenClaw는 **추가 페치 없이** 그대로 사용.

`SOUL.md`/`config.md`는 마크다운 + frontmatter 형태이므로 NestJS 측에서 `gray-matter` 파싱 후 dict로 전달. OpenClaw는 마크다운을 다시 파싱하지 않음.

> 예외: cron tick 경로는 NestJS가 batch 응답을 주므로 OpenClaw가 agent 단위로 다시 묶어 처리.

## 2. build-system-prompt

`SOUL.md` 의미 단위를 시스템 프롬프트 섹션으로 직렬화.

```ts
function buildSystemPrompt(soul: SoulDoc, mem: MemorySnapshot): string {
  return [
    section('Identity', soul.identity),
    section('Personality',
      `tone: ${soul.personality.tone}`,
      `verbosity: ${soul.personality.verbosity}`,
      `formality: ${soul.personality.formality}`,
      `language: ${soul.personality.language}`,
    ),
    section('Behavior Rules',
      ...soul.behavior_rules.map((r, i) => `${i + 1}. ${r}`),
    ),
    section('Boundaries (HARD — never violate)',
      ...soul.boundaries.map(b => `- ${b}`),
    ),
    section('User Context',
      `name: ${mem.profile.name}`,
      `purpose: ${mem.profile.purpose}`,
      mem.interests.length ? `interests: ${mem.interests.join(', ')}` : '',
    ),
    section('Out-of-scope policy',
      `역할 밖 질문은 거절. ${soul.personality.formality} 톤으로.`,
      `예: "${pickOutOfScopePhrase(soul.personality.formality)}"`,
    ),
  ].filter(Boolean).join('\n\n');
}
```

**핵심 규칙**:
- 인사말(`greetings_alert/approach`)은 시스템 프롬프트에 **포함하지 않음**. NestJS BE-06이 static random pick으로 처리하므로 LLM이 흉내 낼 필요 없음.
- `tokens`/`memory recent_history`는 짧게 (5~10개 이벤트). 길어지면 요약 후 주입.

## 3. guardrails (pre-LLM)

LLM 호출 전에 입력 자체로 거절 가능한 케이스를 우선 처리.

```ts
function preflight(input: string, soul: SoulDoc): RefusalReason | null {
  if (matchesAnyBoundary(input, soul.boundaries)) return 'boundary_violation';
  if (matchesUnsafePattern(input)) return 'safety';
  return null;
}
```

거절 시:
- `reply` = formality 맞춘 거절 문구 (static template)
- LLM 호출 스킵 → 토큰 비용 0
- `refused.reason` 반환

## 4. select-skills

`config.md`의 `Skills` 섹션에서 `enabled: true`인 항목만 registry에서 가져와 AI SDK `tools` 객체 구성.

```ts
const tools = Object.fromEntries(
  config.skills
    .filter(s => s.enabled)
    .map(s => [s.id, skillRegistry[s.id]])
    .filter(([, t]) => t),  // registry에 없는 건 무시
);
```

`config.skills` triggers/defaultParams는 description에 추가 컨텍스트로 합성.

## 5. run (LLM 호출)

```ts
import { generateText } from 'ai';
import { gateway } from '@ai-sdk/gateway';

const result = await generateText({
  model: gateway(soul.model ?? 'anthropic/claude-haiku-4-5'),
  system,
  prompt: input,
  tools,
  toolChoice: 'auto',
  maxToolRoundtrips: 4,
  temperature: soul.personality.temperature ?? 0.6,
  abortSignal: AbortSignal.timeout(15_000),
});
```

- 모델은 SOUL.md `model` 필드 우선, 없으면 default (`claude-haiku-4-5` 권장 — 속도/비용 균형).
- `toolChoice: 'auto'` — LLM이 필요할 때만 skill 호출.
- `maxToolRoundtrips`로 무한 호출 방지.
- streaming은 단계 OC-07에서 `streamText`로 전환.

## 6. write-back

응답 직후 NestJS에 부수효과 기록 (실패 무시 — 응답은 이미 사용자에게 전달).

```ts
await Promise.allSettled([
  backend.appendLog(user_id, {
    ts: now(),
    event: `agent:${agent_id}:reply`,
    skills: result.toolCalls.map(t => t.toolName),
  }),
  // alert이면 notifications 리소스에 PUT (tick 경로에서만)
]);
```

## 응답 변환

```ts
return {
  reply: result.text,
  used_skills: unique(result.toolCalls.map(t => t.toolName)),
  tokens: {
    input: result.usage.inputTokens,
    output: result.usage.outputTokens,
  },
  refused: null,
};
```

## 에러 매핑

| 내부 에러 | HTTP | 응답 |
|---|---|---|
| `ZodError` (request) | 400 | `{ error: 'invalid_request', detail }` |
| Token mismatch | 401 | `{ error: 'unauthorized' }` |
| SOUL/config schema invalid | 422 | `{ error: 'agent_misconfigured' }` |
| LLM provider error | 500 | `{ error: 'llm_error' }` |
| LLM timeout (15s) | 504 | `{ error: 'llm_timeout' }` |
| Skill execute error | 500 | `{ error: 'skill_failed', skill }` (또는 LLM 응답에 합쳐 200 반환 가능) |

## 관측 (logging)

각 invoke마다:

```json
{
  "level": "info",
  "evt": "invoke",
  "user_id": "u_...",
  "agent_id": "a_...",
  "trigger": "message",
  "duration_ms": 1820,
  "tokens_in": 1234,
  "tokens_out": 256,
  "skills_used": ["insane-search"],
  "refused": null,
  "model": "anthropic/claude-haiku-4-5"
}
```

Vercel Logs + AI Gateway 대시보드로 충분 (MVP). 추후 Pino + 외부 collector.
