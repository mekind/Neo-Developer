# Skills (= Tools)

OpenClaw에서 Skill은 **AI SDK tool** 1:1 매핑. 사전 정의된 함수만 사용 (사용자 코드 실행 없음).

## 모델

```ts
type Skill = {
  id: string;                      // e.g. 'insane-search'
  name: string;                    // 사람용 이름
  description: string;             // LLM이 보는 설명 (호출 결정 근거)
  schema: z.ZodSchema;             // 입력 검증
  runtime: 'inline' | 'sandbox';   // MVP는 전부 'inline'
  execute: (
    args: unknown,
    ctx: SkillContext
  ) => Promise<unknown>;
};

type SkillContext = {
  user_id: string;
  agent_id: string;
  signal: AbortSignal;
  log: (evt: object) => void;
};
```

## Registry

```ts
// src/skills/index.ts
import { insaneSearch } from './insane-search';
import { summarize } from './summarize';

export const skillRegistry: Record<string, Skill> = {
  'insane-search': insaneSearch,
  'summarize': summarize,
};
```

`config.md`의 `Skills` 섹션이 enable 여부와 trigger 힌트를 제공. registry에 없는 id는 무시.

## AI SDK 변환

각 Skill은 AI SDK `tool()` 인스턴스로 변환:

```ts
import { tool } from 'ai';

export function toAiTool(skill: Skill, ctx: SkillContext) {
  return tool({
    description: skill.description,
    inputSchema: skill.schema,
    execute: async (args) => skill.execute(args, ctx),
  });
}
```

## MVP Skill 목록

### `insane-search`

웹 검색/크롤링. plan 02에서 명시된 핵심 skill.

```ts
import { z } from 'zod';

export const insaneSearch: Skill = {
  id: 'insane-search',
  name: '웹 검색',
  description:
    '웹 검색 및 페이지 가져오기. 블로그 새 글 확인, 뉴스 검색, 일반 정보 조회에 사용.',
  schema: z.object({
    query: z.string().describe('검색 쿼리 또는 URL'),
    sources: z.array(z.string().url()).optional()
      .describe('검색 대상 URL 리스트 (있으면 이 안에서만)'),
    since: z.string().datetime().optional()
      .describe('이 시각 이후 글만'),
    limit: z.number().min(1).max(20).default(5),
  }),
  runtime: 'inline',
  execute: async ({ query, sources, since, limit }, ctx) => {
    // 실제 구현: fetch + 파서. 외부 검색 API 사용 시 env로 키 주입.
    return { results: [/* { title, url, snippet, published_at } */] };
  },
};
```

### `summarize`

긴 텍스트 요약. insane-search 결과를 페르소나 톤으로 요약할 때 자체 호출 (또는 LLM 본 응답에서 처리).

```ts
export const summarize: Skill = {
  id: 'summarize',
  name: '요약',
  description: '긴 텍스트나 여러 항목을 핵심만 요약.',
  schema: z.object({
    text: z.string(),
    max_sentences: z.number().min(1).max(10).default(3),
  }),
  runtime: 'inline',
  execute: async ({ text, max_sentences }, ctx) => {
    // 자체 LLM 호출 또는 단순 룰
    return { summary: '...' };
  },
};
```

## 작성 가이드

1. **id는 kebab-case**, 변경 금지 (config.md에 박혀 있음).
2. **description은 LLM 관점**에서 — "언제 호출해야 하는지"를 명확히. 쓸데없이 호출되면 description에 negative case 추가 (`"이런 경우엔 사용 X"`).
3. **schema는 zod로 명세** — `.describe()` 적극 사용, LLM이 인자 채울 때 힌트가 됨.
4. **execute는 idempotent 지향** — tool roundtrip 중 재시도 가능.
5. **AbortSignal 존중** — 외부 API 호출에 `signal` 전달.
6. **PII/시크릿 로깅 금지** — `ctx.log`에는 메타데이터만.
7. **에러는 throw** — AI SDK가 LLM에 에러 메시지 전달, LLM이 회복 시도.

## 신뢰 모델

| 항목 | 정책 |
|---|---|
| 외부 fetch | allowlist 도메인만? (필요 시 env로) |
| 시크릿 | env에서 직접 read, 응답에 포함 금지 |
| 비용 큰 호출 | timeout + 결과 캐시 (Runtime Cache API 고려) |
| 사용자 정의 skill | **MVP 범위 밖**. 도입 시 `runtime: 'sandbox'` 분기 추가 |

## 미래: Sandbox 분기

사용자/AI가 코드 작성한 skill을 실행해야 할 때:

```ts
async function runSkill(skill: Skill, args: unknown, ctx: SkillContext) {
  if (skill.runtime === 'inline') return skill.execute(args, ctx);
  // sandbox path
  const sb = await Sandbox.create({ timeout: 60_000 });
  return sb.runCommand({ /* skill 코드 + args 전달 */ });
}
```

지금은 함수 자체는 두지 않음. 필요해질 때 한 번에 도입.
