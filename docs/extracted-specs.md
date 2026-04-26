# Extracted Specs — MyClaw

Local reference for agents/skills authors. Synthesize from `docs/plan/*` only; do not reread the plan for the basics.

## Onboarding Flow
- Goal: identify the new user and store user profile data for later reuse.
- Steps: greet → ask nickname/name → ask purpose/rationale → optional interest field → infer tech level from the conversation (do not ask directly).
- Finish: confirm the user and move them into the Gather-style space.
- Output shape: onboarding writes user memory/profile data; later docs normalize this into `profile.md` under the user Memory tree.
- Source refs: `docs/plan/02-personas-and-flows.md:54-88`, `docs/plan/04-requirements.md:5-15`, `docs/plan/05-task-plan.md:84-92`.

## Persona Builder Flow
- Goal: turn natural language into an agent definition, not general chat.
- Core rule: if the request can be handled by a tool, do not ask unnecessary questions; if unclear, ask kindly.
- Flow: analyze intent → extract role/tool fit → ask only missing required info (target, schedule/trigger, delivery channel) → optionally ask tone/personality and appearance → confirm summary → generate files.
- The builder must support varied input styles: clear request, complaint, vague ask, example reference, or compound request.
- Scope rule: out-of-scope chat / advice / emotional support must be rejected and redirected toward agent creation.
- Source refs: `docs/plan/02-personas-and-flows.md:91-300`, `docs/plan/04-requirements.md:18-41`, `docs/plan/06-decision-log.md:25-31`.

## Intent Extraction Checklist
- Check 1: Is this an agent-definition request?
  - Yes → continue.
  - No → reject and redirect.
- Check 2: Is the role clear?
  - Clear → map to tool/skill.
  - Unclear → confirm with a short question like `~하는 거 맞아요?`
- Check 3: Are required fields present?
  - Target (what to watch / answer)
  - Schedule or trigger (when)
  - Delivery channel (where)
- Check 4: If the user is vague, offer examples such as 알림봇 / 대화친구 / 리마인더.
- Check 5: For compound requests, split them and resolve one-by-one.
- Rejection rule: Persona Builder is agent-definition-only; generic chat must be refused with a redirect.
- Source refs: `docs/plan/02-personas-and-flows.md:238-300`, `docs/plan/05-task-plan.md:94-123`.

## Output Schemas

### Memory structure
```text
~/.myclaw/users/{user_id}/
├── index.md
├── log.md
├── profile.md
├── preferences.md
├── agents/
│   ├── index.md
│   └── {agent_id}/
│       ├── persona.md
│       ├── SOUL.md
│       └── config.md
└── context/
    ├── interests.md
    └── history.md
```

### File roles
- `index.md`: hub / document map.
- `log.md`: append-only activity log.
- `profile.md`: identity + purpose + inferred tech level.
- `preferences.md`: user preferences.
- `persona.md`: visual description / pixel-art prompt / palette.
- `SOUL.md`: identity, personality, greetings, rules, boundaries.
- `config.md`: skills, schedule, channels, memory links.
- Source refs: `docs/plan/02-personas-and-flows.md:304-528`, `docs/plan/06-decision-log.md:42-68`.

## Scope Boundaries
- In scope: onboarding, persona building, runtime responses, memory updates, Gather-style interaction.
- Out of scope: generic conversation, emotional counseling, unrelated questions, and any non-agent-definition support.
- Range limits:
  - Onboarding should finish in 3-4 questions.
  - Persona Builder should keep agent count within the documented limit of 3 agents per user.
- Rejection style: be polite, short, and redirect toward agent creation; do not drift into unrelated help.
- Source refs: `docs/plan/02-personas-and-flows.md:202-235`, `docs/plan/04-requirements.md:143-183`, `docs/plan/06-decision-log.md:72-89,128-131`.

## Memory Structure
- Memory is llm-wiki style: folder hierarchy plus `[[link]]` connections.
- Existing context should be reused instead of re-asking: profile, interests, preferences, history.
- Memory is append-friendly where applicable (`log.md`), and links should connect related docs rather than duplicating content.
- Persona Builder should read memory first and only ask for unknowns.
- Source refs: `docs/plan/02-personas-and-flows.md:304-410`, `docs/plan/04-requirements.md:124-130`, `docs/plan/06-decision-log.md:14-16`.

## QA / Validation Anchors
- Onboarding: profile created, name/purpose captured, gather entry happens.
- Builder: natural language request becomes role + tool + missing-info questions + generated `persona.md`, `SOUL.md`, `config.md`.
- Rejection: out-of-scope requests get refused and redirected to agent creation.
- Runtime: `greetings_approach` / `greetings_alert` are static random picks, not LLM-generated.
- Memory: known facts are not re-asked; only unknowns are clarified.
- Limits: 3-agent cap enforced; vague cases should surface examples instead of blocking.
- Source refs: `docs/plan/04-requirements.md:10-90,155-183`, `docs/plan/05-task-plan.md:82-187`, `docs/plan/02-personas-and-flows.md:371-497`.
