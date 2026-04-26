---
type: agent-config
agent_id: daangn-blog-bot-001
---

# Agent Config

## Skills
- insane-search: enabled
  - purpose: 당근 블로그 새 글 확인
  - triggers: ["새 글 확인", "블로그 확인", "당근 소식"]

## Schedule
- type: cron
- expression: "0 8 * * *"
- action: "about.daangn.com/blog 새 글 확인"

## Channels
- primary: in-app
- fallback: none

## Memory
- user_context: ../profile.md
- agent_memory: ./memory.md
