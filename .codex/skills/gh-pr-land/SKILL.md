---
name: gh-pr-land
description: Publish completed local work to GitHub after implementation is done or the final local commit is ready. Use when Codex needs to push the current branch, create a pull request, inspect and resolve merge conflicts by understanding each side's intent, and merge the PR safely with GitHub or `gh`.
---

# GitHub PR Land

## Overview

Use this skill only after the local implementation is complete and the branch is ready to publish.
Finish any remaining local edits and validations first, then use this workflow to push, open a PR, resolve merge friction intentionally, and merge without losing either side's meaning.

## Prerequisites

- Require a git repository with a clear intended scope.
- Require GitHub access through the available GitHub plugin or `gh` CLI.
- Require local validation appropriate to the change before publishing.
- Require the branch to be ready for review; do not use this skill to continue feature implementation.

## Workflow

### 1. Confirm publish readiness

- Run `git status -sb`.
- Inspect the diff and confirm the branch contains only the intended work.
- If there are uncommitted but in-scope changes, stage only the intended files and create the final commit before continuing.
- If the worktree contains unrelated changes, do not publish everything blindly; separate scope first.

### 2. Confirm branch and base

- Detect the current branch with `git branch --show-current`.
- Detect the default or intended base branch.
- If the current branch is the default branch, create a focused branch before pushing.
- Prefer preserving the user's existing branch naming when a non-default branch already exists.

### 3. Verify before publish

- Run the most relevant checks already available in the repository: tests, typecheck, lint, or targeted validation.
- Read the output before moving on.
- If checks fail, fix locally first; do not open or merge a PR around known failures unless the user explicitly wants that risk.

### 4. Push the branch

- Push the current branch to `origin` with upstream tracking when needed.
- Prefer `git push -u origin $(git branch --show-current)` for first push.
- If the branch already tracks a remote branch, use the normal push path.

### 5. Create the PR

- Prefer the GitHub plugin when it can create the PR cleanly.
- Use `gh pr create` when plugin coverage is insufficient or when repo/head/base inference is clearer through CLI.
- Default to a draft PR unless the user explicitly asks for ready-for-review or immediate merge.
- Write a concise PR title and body that explain what changed, why it changed, and how it was verified.

### 6. Check mergeability

- Inspect the PR's merge state after creation.
- If the PR is cleanly mergeable and required checks are green or otherwise acceptable for the repository, proceed toward merge.
- If GitHub reports conflicts, stop treating this as a mechanical merge and inspect the conflicting files directly.

### 7. Resolve conflicts by intent, not by side

When conflicts exist:

- Fetch the latest base branch state.
- Open each conflicted file and identify:
  - what the current branch is trying to preserve or introduce
  - what the base branch changed and why
  - whether both changes must survive in a merged result
- Do not default to `--ours` or `--theirs` across the whole file.
- Preserve behavior and meaning from both sides whenever they are compatible.
- If one side must win, choose based on current repository intent and validation evidence, not convenience.
- After resolving, rerun the most relevant checks for the affected area.
- Commit the conflict resolution clearly, then push the updated branch.

### 8. Merge the PR

- Re-check PR status after the conflict-resolution push.
- Merge only when the PR is in an acceptable state for the repository.
- Prefer the repository's normal merge method; use squash, merge-commit, or rebase merge according to repo convention or user instruction.
- If auto-merge is the normal path and all conditions are satisfied, it is acceptable to enable it instead of waiting manually.

### 9. Report completion

Summarize:

- current branch
- commit(s) pushed
- PR number and URL
- merge method used
- whether conflicts were resolved
- checks run and their outcomes
- any remaining follow-up risk

## Conflict-resolution rules

- Read the conflicted file before editing it.
- Read nearby code or history when the intent is ambiguous.
- Prefer minimal conflict resolutions that preserve both valid changes.
- Re-run verification after every non-trivial conflict resolution.
- If the conflict reveals a product or architectural decision rather than a text merge problem, escalate instead of guessing.

## Safety rules

- Never publish unrelated local changes silently.
- Never merge with unresolved conflicts.
- Never claim merge success without checking the actual PR state.
- Never skip validation after meaningful conflict edits.
- Never overwrite the base branch's intent without first understanding it.

## Output expectations

At the end of the workflow, provide a short operational summary with the PR link, merge state, verification evidence, and any unresolved risk.
