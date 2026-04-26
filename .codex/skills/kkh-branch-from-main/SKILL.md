---
name: kkh-branch-from-main
description: Create a fresh working branch from the latest `origin/main` state and switch to it immediately. Use when Codex needs to start new work from the repository's remote `main` branch and must name the branch `kkh/YYYYMMDD-HHMMSS` using the current local time down to seconds.
---

# KKH Branch From Main

## Overview

Use this skill when starting a new piece of work from a clean `origin/main` baseline.
Create a branch named `kkh/YYYYMMDD-HHMMSS` from the latest remote `main` state, using local current time down to seconds, then switch to that new branch immediately.

## Workflow

### 1. Check repository state

- Run `git status -sb` first.
- If the current worktree has unrelated uncommitted changes that would make switching unsafe or confusing, stop and surface the blocker instead of forcing a branch switch.
- If the current branch already contains in-progress work, do not reuse it for the new task.

### 2. Refresh remote `main`

- Fetch the latest remote state.
- Confirm `origin/main` is available.
- Switch to local `main` only if needed for inspection or synchronization.
- Update local `main` from `origin/main` when that helps keep the local baseline current, but treat `origin/main` as the source of truth for the new branch point.
- If local `main` has diverged, do not branch from the stale or divergent local tip by mistake.

### 3. Generate the branch name

- Use the current local timestamp to seconds.
- Format the timestamp as `YYYYMMDD-HHMMSS`.
- Build the branch name as `kkh/YYYYMMDD-HHMMSS`.
- Example: `kkh/20260426-133045`.

### 4. Create and switch from `origin/main`

- Create the new branch from `origin/main`, not from the current feature branch.
- Prefer a one-step create-and-switch flow when possible.
- Confirm the active branch after switching.
- Confirm the branch start point came from the latest fetched `origin/main` state.

### 5. Report result

Summarize:

- the remote base branch used (`origin/main`)
- the exact branch name created
- whether local `main` was synchronized as part of the setup
- the final active branch

## Safety rules

- Never branch from stale local `main` when `origin/main` has newer commits.
- Never silently discard or overwrite local changes to make switching work.
- Never create the timestamp branch from the current feature branch by mistake.
- Never claim success without checking the active branch name after switching.
- Never treat divergent local `main` as the branch source when `origin/main` is the intended baseline.

## Output expectations

Provide a short operational summary with the exact branch name, confirmation that the shell is now on that branch, and confirmation that the branch was created from `origin/main`.
