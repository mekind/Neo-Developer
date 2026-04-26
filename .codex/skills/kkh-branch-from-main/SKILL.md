---
name: kkh-branch-from-main
description: Create a fresh working branch from `main` and switch to it immediately. Use when Codex needs to start new work from the repository's `main` branch and must name the branch `kkh/YYYYMMDD-HHMMSS` using the current local time down to seconds.
---

# Branch From Main

## Overview

Use this skill when starting a new piece of work from a clean `main` baseline.
Create a branch named `kkh/YYYYMMDD-HHMMSS` from `main`, using local current time down to seconds, then switch to that new branch immediately.

## Workflow

### 1. Check repository state

- Run `git status -sb` first.
- If the current worktree has unrelated uncommitted changes that would make switching unsafe or confusing, stop and surface the blocker instead of forcing a branch switch.
- If the current branch already contains in-progress work, do not reuse it for the new task.

### 2. Refresh `main`

- Fetch the latest remote state.
- Switch to local `main`.
- Update local `main` from `origin/main` before branching.
- If local `main` has diverged or cannot fast-forward cleanly, inspect the state before continuing.

### 3. Generate the branch name

- Use the current local timestamp to seconds.
- Format the timestamp as `YYYYMMDD-HHMMSS`.
- Build the branch name as `kkh/YYYYMMDD-HHMMSS`.
- Example: `kkh/20260426-133045`.

### 4. Create and switch

- Create the new branch from the refreshed `main` tip.
- Switch to the new branch in the same step when possible.
- Confirm the active branch after switching.

### 5. Report result

Summarize:

- the refreshed base branch
- the exact branch name created
- whether `main` was updated before branching
- the final active branch

## Safety rules

- Never branch from stale `main` when `origin/main` can be refreshed first.
- Never silently discard or overwrite local changes to make switching work.
- Never create the timestamp branch from the current feature branch by mistake.
- Never claim success without checking the active branch name after switching.

## Output expectations

Provide a short operational summary with the exact branch name and confirmation that the shell is now on that branch.
