---
name: memory-manager
description: >
  Manage MyClaw user Memory files: create, read, update, and link profile,
  agent persona/soul/config, and context documents under ~/.myclaw/users/{user_id}/.
  Triggers on onboarding completion, agent creation, preference changes, or any
  request to read/write user memory.
---

# Memory Manager Skill

Create, read, update, and link MyClaw Memory files using templates and schemas.
Memory follows an llm-wiki pattern: folder hierarchy plus `[[link]]` connections.

## Mission

Provide a single, consistent instruction set so that any MyClaw agent (onboarding,
persona-builder, runtime) can safely read and write the user Memory tree without
data loss, duplication, or broken links.

## Core Principles

1. **Single source of truth** — each fact lives in exactly one file; other files
   `[[link]]` to it instead of duplicating.
2. **Read before write** — always check existing Memory before asking the user
   a question. Known facts must never be re-asked.
3. **Append-only for logs** — `log.md` is strictly append-only; other files may
   be updated in place.
4. **Template-first** — every new file must be generated from the corresponding
   template in `skills/memory-manager/templates/`.
5. **Schema-aligned** — the structured content of every generated file must
   conform to the matching schema in `skills/output-schemas/`.
6. **No hardcoded identifiers** — never embed a real OS username, absolute home
   path, or real `user_id` into the skill itself; always use the placeholder
   `{user_id}` at instruction time and resolve it at runtime.

## File Structure

The canonical Memory tree for a single user:

```
~/.myclaw/users/{user_id}/
├── index.md            # Document map / hub for this user
├── log.md              # Append-only activity log
├── profile.md          # Identity + purpose + inferred tech level
├── preferences.md      # User preferences (tone, notification, etc.)
├── agents/
│   ├── index.md        # Agent listing
│   └── {agent_id}/
│       ├── persona.md  # Visual description / pixel-art prompt / palette
│       ├── SOUL.md     # Identity, personality, greetings, rules, boundaries
│       └── config.md   # Skills, schedule, channels, memory links
└── context/
    ├── interests.md    # Accumulated interests
    └── history.md      # Key events
```

### File Roles

| File | Purpose | Mutability |
|------|---------|------------|
| `index.md` | Hub linking all user documents | Update when agents are added/removed |
| `log.md` | Chronological activity trail | **Append-only** — never edit/delete existing lines |
| `profile.md` | Core identity (name, purpose, tech_level) | Update on user correction |
| `preferences.md` | Tone, notification, language prefs | Update on user request |
| `persona.md` | Agent visual identity / pixel-art spec | Update on user request |
| `SOUL.md` | Agent personality, greetings, rules | Update on user request |
| `config.md` | Agent skills, schedule, channels | Update on user request |
| `context/interests.md` | Accumulated topics of interest | Append or update |
| `context/history.md` | Notable events | Append or update |

## Template Usage

All templates live at `skills/memory-manager/templates/`. Each uses `{{placeholder}}`
mustache-style variables that the calling agent fills at generation time.

### profile.md.template

Generates `~/.myclaw/users/{user_id}/profile.md`.

| Placeholder | Source | Required |
|-------------|--------|----------|
| `{{user_id}}` | System-assigned user identifier | Yes |
| `{{nickname}}` | Onboarding: user-provided name | Yes |
| `{{created_date}}` | ISO date (YYYY-MM-DD) | Yes |
| `{{updated_date}}` | ISO date, same as created on first write | Yes |
| `{{purpose}}` | Onboarding: why the user joined | Yes |
| `{{tech_level}}` | Inferred from conversation (low/medium/high) — **never ask directly** | Yes |

Frontmatter: `type: user-profile`, plus `links` array to related docs.

### persona.md.template

Generates `~/.myclaw/users/{user_id}/agents/{agent_id}/persona.md`.

| Placeholder | Source | Required |
|-------------|--------|----------|
| `{{agent_id}}` | Kebab-case identifier (e.g., `news-bot-001`) | Yes |
| `{{agent_name}}` | Human-readable name (e.g., `뉴스봇`) | Yes |
| `{{created_date}}` | ISO date | Yes |
| `{{purpose}}` | What the agent does | Yes |
| `{{primary_skill}}` | Main skill category | Yes |
| `{{primary_color}}` | Hex color `#RRGGBB` | Yes |
| `{{secondary_color}}` | Hex color `#RRGGBB` | Yes |
| `{{accent_color}}` | Hex color `#RRGGBB` | Yes |

Frontmatter: `type: agent-persona`.

### soul.md.template

Generates `~/.myclaw/users/{user_id}/agents/{agent_id}/SOUL.md`.

| Placeholder | Source | Required |
|-------------|--------|----------|
| `{{agent_id}}` | Same agent identifier | Yes |
| `{{agent_name}}` | Human-readable name | Yes |
| `{{model_name}}` | LLM model identifier | Yes |
| `{{purpose}}` | Agent purpose statement | Yes |
| `{{tone}}` | Personality tone (e.g., friendly, professional) | Yes |
| `{{formality}}` | `존댓말` or `반말` | Yes |
| `{{primary_skill}}` | Main skill for behavior rules | Yes |
| `{{greeting_alert_1..3}}` | Static greetings for alert events | Yes |
| `{{greeting_approach_1..3}}` | Static greetings for user approach | Yes |

**Canonical greeting keys**: `greetings_alert` and `greetings_approach`.
These are **static random-pick arrays**, not LLM-generated at runtime.

- `greetings_alert` — spoken when the agent has a notification to deliver.
- `greetings_approach` — spoken when the user initiates contact.

Frontmatter: `type: agent-soul`.

### config.md.template

Generates `~/.myclaw/users/{user_id}/agents/{agent_id}/config.md`.

| Placeholder | Source | Required |
|-------------|--------|----------|
| `{{agent_id}}` | Same agent identifier | Yes |
| `{{primary_skill}}` | Skill name | Yes |
| `{{purpose}}` | Skill purpose | Yes |
| `{{trigger_1}}`, `{{trigger_2}}` | Event triggers | Yes |
| `{{schedule_expression}}` | Cron expression | Yes |
| `{{schedule_action}}` | What runs on schedule | Yes |
| `{{primary_channel}}` | Main delivery channel | Yes |
| `{{fallback_channel}}` | Backup channel | Yes |

Frontmatter: `type: agent-config`.

**Note**: The `Memory` section in the template links back to the user profile
via relative path. Use `../profile.md` (not the legacy `../Memory.md` reference).

### index.md.template

Generates `~/.myclaw/users/{user_id}/index.md`.

| Placeholder | Source | Required |
|-------------|--------|----------|
| `{{nickname}}` | User's display name | Yes |
| `{{agent_id}}` | Agent identifier (repeated per agent) | Conditional |
| `{{agent_name}}` | Agent display name (repeated per agent) | Conditional |
| `{{purpose}}` | Agent purpose (repeated per agent) | Conditional |
| `{{primary_skill}}` | Agent primary skill (repeated per agent) | Conditional |

The Agents section grows as agents are created; update `index.md` whenever
a new agent is added.

## Write Rules

1. **Check existence first** — before creating a file, verify the target path
   does not already exist. If it does, update in place (except `log.md`).
2. **Fill all required placeholders** — every `{{placeholder}}` in the template
   must be resolved. If a value is genuinely unavailable, the calling agent must
   ask the user or infer it; never leave raw `{{placeholder}}` text in output.
3. **Create parent directories** — ensure `~/.myclaw/users/{user_id}/` and any
   agent subdirectories exist before writing.
4. **Atomic writes** — write the complete file content in a single operation;
   do not stream partial writes.
5. **Update `index.md`** — after creating any new file, add a `[[link]]` entry
   to the relevant index file.
6. **Update `log.md`** — after any write, append a timestamped log entry
   describing what was created or changed.
7. **Respect the 3-agent cap** — before creating a new agent directory, count
   existing entries under `agents/`. If 3 already exist, inform the user and
   stop.

## Read Rules

1. **Read before asking** — when an agent needs user context, read `profile.md`,
   `preferences.md`, and `context/interests.md` first. Only ask for information
   not already stored.
2. **Follow links** — when a file contains `[[links]]`, resolve them to read
   related context. This is how Memory connections propagate.
3. **Use `index.md` as entry point** — to discover what files exist for a user,
   start from `~/.myclaw/users/{user_id}/index.md`.
4. **Never cache stale data** — always read from the file system; do not rely
   on previously-read values across conversation turns if an update may have
   occurred.

## Append-only Log Rules

`log.md` is the only append-only file. All other files may be updated in place.

1. **New entries go at the top** — newest first, immediately below the heading.
2. **Entry format**: `- YYYY-MM-DD HH:MM: {action} → [[link]]`
3. **Never delete or edit** existing log lines.
4. **Log every mutation** — profile creation, agent creation, preference change,
   agent update, agent deletion.

Example:
```markdown
# Activity Log

<!-- newest first -->
- 2026-04-26 14:30: 에이전트 "뉴스봇" 생성 → [[agents/news-bot-001/persona]]
- 2026-04-26 14:00: 온보딩 완료 → [[profile]] 생성
- 2026-04-26 13:55: 첫 접속
```

## llm-wiki Link Rules

Memory uses wiki-style `[[link]]` connections to avoid content duplication.

1. **Link format**: `[[relative-path]]` from the current file's directory.
   - Same directory: `[[profile]]`, `[[preferences]]`
   - Subdirectory: `[[agents/news-bot-001/persona]]`
   - Aliased: `[[agents/news-bot-001/persona|뉴스봇]]`
2. **Bidirectional intent** — when file A links to file B, file B should ideally
   link back to A. Enforce this for `profile.md` ↔ `agents/index.md` and
   `profile.md` ↔ `context/interests.md`.
3. **Link on creation** — every new file must add at least one inbound link
   (from `index.md`) and at least one outbound link (in its `links` frontmatter
   or `Related` section).
4. **No orphans** — every file in the Memory tree must be reachable from
   `index.md` via link traversal.
5. **No duplication** — if information exists in `profile.md`, other files
   must `[[profile]]`-link to it, not repeat the data.

## Output Schema Alignment

Each generated markdown file must correspond to its JSON schema in
`skills/output-schemas/`:

| File | Schema | Key validations |
|------|--------|-----------------|
| `profile.md` | `profile.schema.json` | `frontmatter.type = "user-profile"`, `content.identity.name` required, `content.context.tech_level` required |
| `persona.md` | `persona.schema.json` | `frontmatter.type = "agent-persona"`, `content.color_palette.*` must be `#RRGGBB` hex |
| `SOUL.md` | `soul.schema.json` | `frontmatter.type = "agent-soul"`, `content.greetings_alert` array min 1, `content.greetings_approach` array min 1, `content.personality.formality` ∈ {`존댓말`, `반말`} |
| `config.md` | `config.schema.json` | `frontmatter.type = "agent-config"`, `content.skills` array min 1, `content.schedule.type = "cron"` |

**Validation approach**: Parse the generated markdown into a structured object
(frontmatter + content sections) and check it against the schema. If `bunx ajv`
is unavailable, use manual field-by-field checks or `node -e` with
`JSON.parse()` to verify the structure.

## Examples

### Example 1: Onboarding Profile Creation

**Scenario**: The onboarding agent has just collected user information and needs
to initialize the Memory tree.

**Inputs gathered during onboarding**:
- nickname: 수진
- purpose: 반복 업무 자동화
- tech_level: medium (inferred, not asked)

**Step 1: Create directory structure**

```
~/.myclaw/users/{user_id}/
├── context/
└── agents/
```

**Step 2: Fill `profile.md.template`**

```markdown
---
type: user-profile
created: 2026-04-26
updated: 2026-04-26
links:
  - [[preferences]]
  - [[context/interests]]
---

# Profile

## Identity
- user_id: {user_id}
- name: 수진
- joined: 2026-04-26

## Context
- purpose: 반복 업무 자동화
- tech_level: medium (추론됨)

## Related
- 선호도: [[preferences]]
- 관심사: [[context/interests]]
- 만든 에이전트: [[agents/index]]
```

**Step 3: Fill `index.md.template`**

```markdown
# 수진's Space

## Profile
- [[profile]] - 기본 정보
- [[preferences]] - 선호도

## Agents
(아직 없음)

## Context
- [[context/interests]] - 관심사
- [[context/history]] - 활동 이력
```

**Step 4: Initialize `log.md`**

```markdown
# Activity Log

<!-- newest first -->
- 2026-04-26 14:00: 온보딩 완료 → [[profile]] 생성
- 2026-04-26 13:55: 첫 접속
```

**Step 5: Validate**

Check `profile.md` content against `profile.schema.json`:
- `frontmatter.type` = `"user-profile"` — pass
- `content.identity.name` = `"수진"` — pass
- `content.context.purpose` = `"반복 업무 자동화"` — pass
- `content.context.tech_level` = `"medium (추론됨)"` — pass

### Example 2: Persona-Builder Agent Creation

**Scenario**: User 수진 says "경쟁사 블로그 알려주는 봇 만들어줘". The persona-builder
reads Memory first, then creates agent files.

**Step 1: Read existing Memory**

```
Read profile.md    → tech_level: medium
Read preferences.md → tone: friendly, notification: morning
Read context/interests.md → 마케팅, 트렌드
```

Result: the builder already knows the user's context. It only confirms:
"마케팅 관련 블로그를 모니터링하는 거죠? 매일 아침에 알려드릴까요?"

**Step 2: Check agent count**

Read `agents/` directory → 0 agents (under cap of 3). Proceed.

**Step 3: Create `agents/news-bot-001/` directory**

**Step 4: Fill `persona.md.template`**

```markdown
---
type: agent-persona
agent_id: news-bot-001
created: 2026-04-26
---

# Agent Persona: 뉴스봇

## Visual Description
뉴스봇을 나타내는 시각적 묘사.
경쟁사 블로그 모니터링에 어울리는 개성 있는 캐릭터 디자인.

## Pixel Art Prompt
"cute character for 뉴스봇, focused on blog-monitoring,
matching 경쟁사 블로그 모니터링, 16x16 pixel art style, clean lines"

## Color Palette
- Primary: #2563EB
- Secondary: #1E40AF
- Accent: #F59E0B
```

**Step 5: Fill `soul.md.template`**

```markdown
---
type: agent-soul
agent_id: news-bot-001
model: claude-sonnet
---

# Soul: 뉴스봇

## Identity
당신은 "뉴스봇"입니다. 경쟁사 블로그 모니터링을 돕는 에이전트입니다.

## Personality
- tone: friendly
- verbosity: concise
- emoji_usage: moderate
- language: Korean
- formality: 존댓말

## Greetings (Static, Random Pick)
# 알림 있을 때 부르는 인사말
greetings_alert:
  - "수진님, 새 블로그 글이 올라왔어요!"
  - "확인하실 소식이 있어요."
  - "오늘의 블로그 업데이트를 가져왔어요."

# 사용자가 다가왔을 때 인사말
greetings_approach:
  - "안녕하세요 수진님! 블로그 소식 궁금하셨어요?"
  - "수진님, 무엇을 도와드릴까요?"
  - "반가워요! 최근 트렌드가 궁금하시면 말씀해주세요."

## Behavior Rules
1. blog-monitoring 관련 요청을 우선 처리
2. 링크는 항상 포함
3. 사용자가 "자세히"라고 하면 전문 제공
4. 관련 없는 질문엔 정중히 범위를 안내

## Boundaries
- 확인되지 않은 정보 전달 금지
- 역할 밖의 행동 금지
```

**Step 6: Fill `config.md.template`**

```markdown
---
type: agent-config
agent_id: news-bot-001
---

# Agent Config

## Skills
- blog-monitoring: enabled
  - purpose: 경쟁사 블로그 모니터링
  - triggers: ["new_post", "keyword_match"]

## Schedule
- type: cron
- expression: "0 8 * * *"
- action: "check_blogs_and_notify"

## Channels
- primary: gather
- fallback: discord

## Memory
- user_context: ../profile.md
- agent_memory: ./news-bot-001/memory.md
```

**Step 7: Update `index.md`** — add agent entry to the Agents section:

```markdown
## Agents
- [[agents/news-bot-001/persona|뉴스봇]] - 경쟁사 블로그 모니터링
- [[agents/news-bot-001/config|뉴스봇 설정]] - blog-monitoring
```

**Step 8: Append to `log.md`**

```markdown
- 2026-04-26 14:30: 에이전트 "뉴스봇" 생성 → [[agents/news-bot-001/persona]]
```

**Step 9: Validate all outputs**

Check each file against its schema. Verify `[[links]]` resolve to existing
files. Confirm no orphan files exist.

## Anti-Patterns

| Anti-Pattern | Why it's wrong | Correct approach |
|-------------|---------------|-----------------|
| Re-asking known info | Wastes user time, breaks trust | Read Memory first, ask only unknowns |
| Duplicating data across files | Leads to stale copies | Use `[[link]]` instead |
| Editing `log.md` entries | Destroys audit trail | Append-only, newest first |
| Leaving `{{placeholders}}` in output | Broken file, schema violation | Fill every placeholder or error out |
| Hardcoding `user_id` or usernames | Breaks portability | Always use `{user_id}` placeholder |
| Exceeding 3-agent cap silently | Violates product rule | Count agents/ entries before creating |
| Creating files without updating `index.md` | Orphan files | Always add link to index after creation |
| Creating files without `log.md` entry | Lost audit trail | Always append log after mutation |
| LLM-generating greetings at runtime | Greetings must be static | Use `greetings_alert` / `greetings_approach` arrays, pick randomly |
| Using `Memory.md` or `../Memory.md` | Legacy naming | Use `profile.md` / `../profile.md` |
| Skipping schema validation | Silent structural errors | Validate against output-schemas/ |
| Asking user their tech level directly | Must be inferred | Infer from conversation signals |
| Force-overwriting existing files | Data loss | Check existence, update or ask user |

## Review Checklist

Before considering a Memory write operation complete, verify:

- [ ] **Directory exists**: `~/.myclaw/users/{user_id}/` and all needed
      subdirectories are created.
- [ ] **Template used**: file was generated from the correct template, not
      written freehand.
- [ ] **All placeholders filled**: no raw `{{...}}` text remains.
- [ ] **Frontmatter correct**: `type` field matches the expected constant for
      the file kind.
- [ ] **Schema aligned**: structured content would pass the corresponding
      JSON schema in `skills/output-schemas/`.
- [ ] **`index.md` updated**: new file has a `[[link]]` in the appropriate
      index.
- [ ] **`log.md` appended**: a timestamped entry for this action was added.
- [ ] **Links resolve**: every `[[link]]` in the new/updated file points to
      an existing file.
- [ ] **No duplicated facts**: information is stored in one canonical location
      and linked from others.
- [ ] **Agent cap respected**: if creating an agent, count confirmed ≤ 3.
- [ ] **Read-before-write honored**: existing Memory was checked before asking
      the user any questions.
- [ ] **Greeting keys canonical**: SOUL files use `greetings_alert` and
      `greetings_approach` (not variants).
- [ ] **No hardcoded identifiers**: no real OS usernames or literal user IDs
      in the skill output.
