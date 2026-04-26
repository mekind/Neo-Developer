# OpenAI Model-Based Schema Normalization & Classification for Game-Asset Catalogs

> Research Date: 2026-04-26
> Context: MyClaw LPC character pipeline — mapping persona descriptions to a 655-item game-asset catalog
> Scope: OpenAI models only. No Anthropic/Google recommendations.

---

## Executive Summary

OpenAI provides a production-grade stack for deterministic JSON extraction and classification:

1. **Structured Outputs** (`response_format: { type: "json_schema", strict: true }`) guarantees schema conformance — no post-hoc validation needed
2. **gpt-4.1-nano** is the sweet spot for classification/normalization tasks: $0.05/$0.20 per 1M tokens, 1M context, best instruction-following in its class
3. **Batch API** cuts costs 50% for offline catalog processing (24h window, same models)
4. **Responses API** with `.parse()` helper + Zod/Pydantic gives type-safe, retry-free pipelines in TS/Python

---

## 1. Model Choice

### Recommendation Matrix

| Task | Recommended Model | $/1M in / $/1M out | Why |
|---|---|---|---|
| **Catalog item classification** (persona → LPC item mapping) | `gpt-4.1-nano` | $0.05 / $0.20 | Fastest, cheapest. 80.1% MMLU, ideal for "classification or autocompletion" (OpenAI official). 1M context fits entire catalogs. |
| **Complex multi-step normalization** (ambiguous descriptions, reasoning needed) | `gpt-4.1-mini` | $0.20 / $0.80 | Better instruction-following (84.1% IFEval vs nano's 74.5%). Worth the 4x cost when accuracy matters. |
| **Quality gate / eval grading** | `gpt-4.1` | $1.00 / $4.00 | Highest accuracy for schema correctness verification. Use as grader, not bulk processor. |
| **Batch offline processing** (nightly catalog rebuild) | Any above + Batch API | 50% off all prices | Same models, 50% cheaper. 24h completion window (usually faster). |

### Key Tradeoffs (from benchmarks)

```
Model            IFEval  MultiChallenge  NER     Structured Outputs
gpt-4.1          87.4%   38.3%           -       Excellent
gpt-4.1-mini     84.1%   35.8%           66.7%   Good (some reports of struggles*)
gpt-4.1-nano     74.5%   15.0%           42.9%   Good (handles structured outputs fine)
gpt-4o-mini      78.4%   20.3%           61.9%   Excellent (most battle-tested)
```

> *Community reports (April 2025) indicate `gpt-4.1-mini` occasionally struggles with structured outputs where `gpt-4o-mini` and `gpt-4.1-nano` handle them fine. Test with your schema before committing.

### Practical Advice

- **Start with `gpt-4.1-nano`** for the LPC mapping task. The catalog is a constrained enum space (~655 items, ~30 groups). This is classification, not reasoning.
- **Fallback to `gpt-4.1-mini`** if nano's accuracy is insufficient on your eval set.
- **`gpt-4o-mini`** remains a safe fallback — most mature structured outputs support, well-tested in production.
- **Avoid reasoning models** (o3, o4-mini) for this task. They're 10-50x more expensive and unnecessary for enum mapping.

---

## 2. Structured Outputs — The Core Mechanism

### What It Is

Structured Outputs guarantees the model's response **exactly** conforms to your JSON Schema. Unlike JSON mode (which only guarantees valid JSON), Structured Outputs:

- Never omits required keys
- Never hallucinates invalid enum values
- Never produces type mismatches
- Makes retry-for-format unnecessary

### How to Use (TypeScript / Responses API)

```typescript
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

// Define the schema
const LpcSelection = z.object({
  itemId: z.string().describe("Must exist in catalog selectionGroups"),
  variant: z.string().describe("One of item's variants, or empty string"),
  recolor: z.string().describe("One of palette colors, or empty string"),
  name: z.string().describe("Short human label"),
});

const LpcState = z.object({
  version: z.literal(2),
  bodyType: z.enum(["male", "female", "teen", "child", "muscular", "pregnant"]),
  selections: z.record(z.string(), LpcSelection),
  selectedAnimation: z.literal("walk"),
});

const client = new OpenAI();

const response = await client.responses.parse({
  model: "gpt-4.1-nano",
  input: [
    { role: "system", content: systemPrompt },     // includes catalog
    { role: "user", content: personaMarkdown },
  ],
  text: {
    format: zodTextFormat(LpcState, "lpc_state"),
  },
  temperature: 0,          // deterministic
  // max_output_tokens: 2000,  // optional safety cap
});

// Type-safe access — no JSON.parse, no validation needed
const state: z.infer<typeof LpcState> = response.output_parsed!;
```

### How to Use (Python / Pydantic)

```python
from openai import OpenAI
from pydantic import BaseModel
from typing import Dict, Literal

class LpcSelection(BaseModel):
    itemId: str
    variant: str
    recolor: str
    name: str

class LpcState(BaseModel):
    version: Literal[2]
    bodyType: Literal["male", "female", "teen", "child", "muscular", "pregnant"]
    selections: Dict[str, LpcSelection]
    selectedAnimation: Literal["walk"]

client = OpenAI()

completion = client.chat.completions.parse(
    model="gpt-4.1-nano",
    messages=[
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": persona_md},
    ],
    response_format=LpcState,
    temperature=0,
)

state = completion.choices[0].message.parsed  # type: LpcState
```

### Schema Constraints (Important)

Structured Outputs supports a **subset** of JSON Schema. Key limitations:

- `additionalProperties: false` is required on all objects (SDK adds this automatically)
- All fields must be `required` (use nullable types for optional fields: `z.string().nullable()`)
- No `minItems`, `maxItems`, `pattern`, `format` enforcement by the model
- Recursive schemas are supported but depth is limited
- `enum` values ARE enforced — use this for catalog item IDs if the list is small enough
- Max 5 levels of nesting, max 100 properties per object, max 500 enum values

### When Structured Outputs Are Insufficient

If you need constraints beyond what the schema supports (e.g., "itemId must exist in catalog"), you need **application-level validation** after parsing. The model guarantees structural correctness, not semantic correctness.

---

## 3. Prompt Contract for Catalog Normalization

### System Prompt Architecture

```
┌─────────────────────────────┐
│ ROLE & TASK DEFINITION      │  ← What the model does
│ ─────────────────────────── │
│ CATALOG DATA (JSON)         │  ← The truth table (sent in full)
│ ─────────────────────────── │
│ FIELD CHOICE RULES          │  ← Disambiguation rules
│ ─────────────────────────── │
│ OUTPUT SCHEMA DESCRIPTION   │  ← Redundant with structured outputs, but helps accuracy
│ ─────────────────────────── │
│ EXAMPLES (1-3 few-shot)     │  ← Optional but helps edge cases
└─────────────────────────────┘
```

### Key Principles

1. **Send the full catalog in system prompt**. At ~22K tokens for the LPC curated catalog, this is well within context limits. The model needs the full truth table to make correct selections.

2. **Use explicit disambiguation rules**. The current mapper.py approach is correct:
   - "variants present → use variant; recolor must be empty"
   - "recolorPalette present → use recolor; variant must be empty"
   - "DO NOT use a value not literally in the catalog"

3. **`temperature: 0`** for deterministic classification. Same input should produce same output.

4. **Structured Outputs handles format enforcement**. No need for "Return valid JSON" instructions. Focus the prompt on *semantic* correctness instead.

5. **Pin model snapshots** in production (e.g., `gpt-4.1-nano-2025-04-14` instead of `gpt-4.1-nano`) to prevent behavior changes from model updates.

---

## 4. Validation Strategy (Beyond Schema)

Structured Outputs guarantees JSON structure. You still need to validate:

### Layer 1: Schema (Free — Structured Outputs)
- All required fields present ✓
- Correct types ✓
- Enum values match (if using z.enum()) ✓

### Layer 2: Semantic Validation (Your Code)
```typescript
function validateLpcState(state: LpcState, catalog: LpcCatalog): ValidationResult {
  const errors: string[] = [];

  // bodyType exists in catalog
  if (!catalog.bodyTypes.includes(state.bodyType)) {
    errors.push(`Invalid bodyType: ${state.bodyType}`);
  }

  for (const [group, sel] of Object.entries(state.selections)) {
    // selectionGroup exists
    if (!catalog.selectionGroups[group]) {
      errors.push(`Unknown group: ${group}`);
      continue;
    }
    // itemId exists in group
    const item = catalog.selectionGroups[group].items[sel.itemId];
    if (!item) {
      errors.push(`Unknown itemId: ${sel.itemId} in group ${group}`);
      continue;
    }
    // variant/recolor correctness
    if (sel.variant && item.variants && !item.variants.includes(sel.variant)) {
      errors.push(`Invalid variant: ${sel.variant} for ${sel.itemId}`);
    }
    if (sel.recolor && item.recolorPalette) {
      const palette = catalog.palettes[item.recolorPalette];
      if (palette && !palette.colors.includes(sel.recolor)) {
        errors.push(`Invalid recolor: ${sel.recolor} for ${sel.itemId}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
```

### Layer 3: Retry on Semantic Failure
```typescript
async function mapWithRetry(persona: string, catalog: LpcCatalog, maxRetries = 2): Promise<LpcState> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const state = await callMapper(persona, catalog);
    const validation = validateLpcState(state, catalog);

    if (validation.valid) return state;

    if (attempt < maxRetries) {
      // Feed errors back to model for self-correction
      const correctionPrompt = `Previous output had errors:\n${validation.errors.join("\n")}\n\nPlease fix these issues.`;
      // ... retry with correction context
    }
  }
  throw new Error("Failed to produce valid mapping after retries");
}
```

---

## 5. Batch API for Catalog Processing

### When to Use

- Rebuilding/re-normalizing the entire LPC catalog
- Bulk-classifying new assets added to catalog
- Running evals across many persona test cases
- Any non-real-time processing

### How It Works

```
1. Create JSONL file (one request per line)
2. Upload file → get file_id
3. Create batch → get batch_id
4. Poll for completion (usually < 1 hour for small batches)
5. Download results JSONL
```

### Cost Impact

| Model | Standard ($/1M in / out) | Batch ($/1M in / out) | Savings |
|---|---|---|---|
| gpt-4.1-nano | $0.05 / $0.20 | $0.025 / $0.10 | 50% |
| gpt-4.1-mini | $0.20 / $0.80 | $0.10 / $0.40 | 50% |
| gpt-4o-mini | $0.075 / $0.30 | $0.0375 / $0.15 | 50% |

### Batch + Structured Outputs (TypeScript JSONL Example)

```jsonl
{"custom_id": "persona-001", "method": "POST", "url": "/v1/chat/completions", "body": {"model": "gpt-4.1-nano", "messages": [{"role": "system", "content": "..."}, {"role": "user", "content": "...persona text..."}], "response_format": {"type": "json_schema", "json_schema": {"name": "lpc_state", "strict": true, "schema": { ... }}}, "temperature": 0}}
{"custom_id": "persona-002", "method": "POST", "url": "/v1/chat/completions", "body": { ... }}
```

### Batch Limits
- Max 50,000 requests per batch
- Max 200 MB input file
- 24-hour completion window (usually much faster)
- Separate rate limit pool (won't affect your real-time API calls)

---

## 6. Retry & Idempotency

### Built-in SDK Retries

The OpenAI Node SDK has built-in retry with exponential backoff:

```typescript
const client = new OpenAI({
  maxRetries: 3,           // default: 2
  timeout: 30_000,         // 30s timeout
});
```

This handles transient errors (429, 500, 503) automatically.

### Application-Level Retry Strategy

```typescript
import { retry } from "some-retry-lib"; // or manual implementation

const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,        // 1s
  maxDelay: 30000,            // 30s
  backoffMultiplier: 2,
  jitter: true,
  retryOn: [
    // Network/API errors (SDK handles these, but belt + suspenders)
    "rate_limit_exceeded",
    "server_error",
    "timeout",
    // Semantic validation failures (your logic)
    "semantic_validation_failed",
  ],
};
```

### Idempotency Keys

OpenAI doesn't natively support idempotency keys, but you can build your own:

```typescript
// Hash input to create deterministic cache key
import { createHash } from "crypto";

function cacheKey(persona: string, catalogHash: string, model: string): string {
  return createHash("sha256")
    .update(JSON.stringify({ persona, catalogHash, model }))
    .digest("hex");
}

// Check cache before calling API
const key = cacheKey(personaText, catalogVersion, "gpt-4.1-nano");
const cached = await cache.get(key);
if (cached) return cached;

const result = await callMapper(personaText);
await cache.set(key, result, { ttl: 86400 }); // 24h cache
```

### Pipeline Safety Pattern

```
Input → Hash → Cache Check
                  ├── HIT → Return cached result
                  └── MISS → OpenAI Call
                                ├── Schema Valid (guaranteed by Structured Outputs)
                                ├── Semantic Valid → Cache + Return
                                └── Semantic Invalid → Retry (max 2)
                                                        ├── Success → Cache + Return
                                                        └── Fail → Return with warnings
```

---

## 7. Cost Control Playbook

### For the LPC Pipeline Specifically

Assuming ~22K input tokens (catalog) + ~500 tokens (persona) + ~1K output tokens per mapping:

| Model | Cost per Mapping | 1,000 Mappings | 1,000 Mappings (Batch) |
|---|---|---|---|
| gpt-4.1-nano | $0.001 + $0.0002 = $0.0012 | $1.20 | $0.60 |
| gpt-4.1-mini | $0.0045 + $0.0008 = $0.0053 | $5.30 | $2.65 |
| gpt-4o-mini | $0.0017 + $0.0003 = $0.002 | $2.00 | $1.00 |

### Cost Optimization Tactics

1. **Prompt Caching** — OpenAI automatically caches system prompts. The 22K catalog in system prompt gets cached after first call. Subsequent calls with same system prompt pay reduced input rates.

2. **Curated Catalog Subset** — Your current approach (lpc-catalog-curated.json at ~105KB/22K tokens) is correct. Don't send the full 655-item catalog if a smaller subset suffices.

3. **Model Routing** — Use nano for straightforward personas, mini for ambiguous ones:
   ```typescript
   const model = persona.includes("비인간") || persona.length > 2000
     ? "gpt-4.1-mini"
     : "gpt-4.1-nano";
   ```

4. **Batch for Evals/Rebuilds** — Any time you're processing more than 10 items non-interactively, use Batch API for 50% savings.

5. **Cache Aggressively** — Same persona + same catalog version = same result. Cache with content hash.

6. **`max_output_tokens`** — Cap at expected output size (e.g., 2000 tokens for LPC state JSON) to prevent runaway generation.

---

## 8. Migration Path from Gemini

The current pipeline uses `gemini-2.5-flash` via `google-genai`. Key differences for OpenAI migration:

| Aspect | Current (Gemini) | OpenAI Equivalent |
|---|---|---|
| SDK | `google-genai` | `openai` (Python) or `openai` (Node) |
| Structured Output | Gemini's JSON mode | `response_format: json_schema` with `strict: true` |
| Schema definition | In-prompt description | Pydantic model (Python) or Zod schema (TS) — SDK converts to JSON Schema automatically |
| Format guarantee | Gemini: best-effort JSON | OpenAI Structured Outputs: **guaranteed** schema conformance |
| Model | `gemini-2.5-flash` | `gpt-4.1-nano` (equivalent tier) |
| Cost | Gemini 2.5 Flash is free-tier eligible | gpt-4.1-nano: $0.05/$0.20 per 1M tokens |
| Retry | Manual | SDK built-in + manual semantic retry |
| Batch | N/A | 50% cost reduction via Batch API |

### Migration Effort Estimate

- **mapper.py rewrite**: ~2 hours (swap SDK, define Pydantic/Zod schema, update prompt)
- **Validation layer**: ~1 hour (catalog-aware semantic validation)
- **Testing**: ~2 hours (run against existing persona test cases, compare output quality)

---

## 9. Recommended Architecture

```
persona.md
    │
    ▼
┌────────────────────────┐
│  Input Hasher / Cache  │ ← Skip API call if cached
│  Check                 │
└───────────┬────────────┘
            │ MISS
            ▼
┌────────────────────────┐
│  OpenAI Structured     │ ← gpt-4.1-nano (or mini for complex)
│  Outputs Call          │    response_format: json_schema + strict
│  temperature: 0        │    Zod/Pydantic schema = LpcState
│  pinned snapshot       │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│  Semantic Validator    │ ← Verify itemId/variant/recolor exist in catalog
│  (catalog-aware)       │
└───────┬────────┬───────┘
        │ PASS   │ FAIL (max 2 retries)
        ▼        ▼
   ┌────────┐ ┌──────────────┐
   │ Cache  │ │ Retry with   │
   │ + Use  │ │ error context│
   └────────┘ └──────────────┘
```

### For Bulk/Offline Processing

```
N persona files
    │
    ▼
┌─────────────────────┐
│  Build JSONL         │ ← One request per persona
│  (Structured Outputs │
│   in each request)   │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  Upload + Create    │ ← Batch API (50% cheaper)
│  Batch Job          │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  Poll + Download    │ ← Usually < 1 hour
│  Results JSONL      │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  Parse + Validate   │ ← Semantic validation per result
│  per Result         │
└─────────────────────┘
```

---

## 10. Sources

| Source | URL | Key Insight |
|---|---|---|
| OpenAI Structured Outputs Guide | https://developers.openai.com/docs/guides/structured-outputs | Guaranteed schema conformance, `strict: true` |
| OpenAI Batch API Guide | https://developers.openai.com/docs/guides/batch | 50% cost, 24h window, 50K requests/batch |
| OpenAI Cost Optimization | https://developers.openai.com/docs/guides/cost-optimization | Batch + flex processing + prompt caching |
| OpenAI Rate Limits / Retry | https://developers.openai.com/docs/guides/rate-limits | Exponential backoff with jitter |
| OpenAI Production Best Practices | https://developers.openai.com/docs/guides/production-best-practices | MLOps, security, scaling |
| OpenAI Fine-tuning / Model Optimization | https://developers.openai.com/docs/guides/fine-tuning | Eval → prompt → fine-tune flywheel |
| GPT-4.1 Announcement | https://openai.com/research/gpt-4-1 | nano: "ideal for classification or autocompletion" |
| OpenAI Node SDK (structured-outputs example) | https://github.com/openai/openai-node/blob/master/examples/responses/structured-outputs.ts | `zodTextFormat` + `.parse()` |
| OpenAI Cookbook: Batch Processing | https://developers.openai.com/cookbook/examples/batch_processing/ | JSONL format, classification example |
| OpenAI Cookbook: Structured Outputs Intro | https://developers.openai.com/cookbook/examples/structured_outputs_intro/ | `strict: true`, refusal handling |
| Community Benchmarks (Reddit) | https://reddit.com/r/OpenAI/comments/1jz9whh/ | gpt-4.1-mini structured output issues, nano handles fine |
| openbatch Library | https://daniel-gomm.github.io/blog/2025/openbatch/ | Pydantic-powered batch convenience wrapper |
| Pricing (April 2026) | https://platform.openai.com/docs/pricing | Full model pricing table |

---

## 11. TL;DR Decision Table

| Question | Answer |
|---|---|
| Which model? | `gpt-4.1-nano` for classification. `gpt-4.1-mini` for complex/ambiguous inputs. |
| JSON enforcement? | Structured Outputs with `strict: true`. Use Zod (TS) or Pydantic (Python). |
| Temperature? | `0` for deterministic mapping. |
| Batch processing? | Yes — 50% cheaper via Batch API for any non-real-time work. |
| Retry strategy? | SDK handles transient errors. Add semantic validation + retry with error feedback (max 2). |
| Cost per mapping? | ~$0.001 with nano. ~$0.0005 with nano + Batch. |
| Pin model version? | Yes. Use `gpt-4.1-nano-2025-04-14` in production. |
| Cache? | Hash(persona + catalog_version + model) → cache result. |
| Migration effort from Gemini? | ~5 hours total (rewrite + validate + test). |
