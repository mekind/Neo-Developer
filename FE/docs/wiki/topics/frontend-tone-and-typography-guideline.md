# Frontend Tone & Typography Guideline

## Purpose

This guideline defines the recommended UI mood and typography direction for the current **demo / prototype** frontend track.
It should be used as the default reference when future FE work needs a consistent visual tone, readable copy, and approachable interaction framing.

## Core Direction

The recommended direction is:

- **warm-neutral** rather than cold/technical
- **accessibility-first** rather than personality-first
- **Hangul-legibility-first** rather than novelty-first
- **neutral midtone** rather than extreme dark or bright baselines

In short, the interface should feel **warm, calm, readable, and easy to approach**.

## Why this direction

The goal is not to make the product merely look friendly.
The goal is to **lower the entry barrier** for first-time viewers.
That means the UI should feel:

- less intimidating
- easier to read quickly
- emotionally approachable without becoming childish
- calm enough for a demo setting without looking cold or exclusive

## Tone principles

### 1. Friendly means warm and caring
- use language and layout choices that feel considerate
- prefer soft, clear guidance over high-energy visual push
- make the interface feel welcoming before it feels impressive

### 2. Accessibility comes before brand flair
- readability beats uniqueness
- clarity beats cleverness
- stable hierarchy beats visually noisy expression

### 3. Calm approachability beats strong identity performance
- avoid making the UI feel like a game HUD, luxury editorial product, or mascot-heavy service
- keep emotional warmth, but hold back exaggerated cuteness or theatrical styling

## Visual baseline

### Recommended baseline: neutral midtone
The UI should move toward a **neutral midtone base**.
That means:

- softer surfaces instead of deep near-black backgrounds by default
- enough contrast for readability, but without harsh, cold contrast extremes
- low-saturation warmth rather than neon emphasis
- restrained accent usage that supports hierarchy instead of dominating the screen

### Translation for the current FE baseline
Current FE styling is closer to:
- dark radial background
- glassmorphism cards
- mint accent highlights

Future FE styling should shift toward:
- warmer neutral surfaces
- gentler depth and contrast
- accents that feel helpful and calm rather than sharp or game-like

## Typography direction

### Primary rule
- **Hangul legibility first**

Typography decisions should optimize for comfortable Korean reading before brand distinctiveness.

### What that means in practice
- prefer clean sans-serif families with strong Korean readability
- avoid decorative or overly stylized headline fonts as the default system voice
- maintain clear hierarchy with size, weight, and spacing before relying on unusual type personality
- keep paragraph and supporting text comfortable for scanning during a short demo

### Recommended font posture
For the first pass, prefer a **Korean-readable sans-serif system** with minimal friction.
A practical direction is:

- body text: Korean-first readable sans-serif
- headings: same family or a closely matched family with slightly stronger weight contrast
- fallback strategy: keep safe system fallbacks for stable rendering

### Candidate families to evaluate later
These are **candidates**, not final locked choices:
- **Pretendard** — strong all-purpose Korean UI readability, familiar and modern
- **SUIT** — clean and contemporary while staying controlled
- **Noto Sans KR** — robust fallback-friendly readability baseline

If a single-family system is preferred, **Pretendard** is the most natural first recommendation from the current clarified requirements.

## Copy / wording guidance

UI wording should feel:
- plainspoken
- calm
- welcoming
- low-friction

Prefer:
- direct guidance
- simple verbs
- short supportive phrasing
- explanatory copy that reduces uncertainty

Avoid:
- overly technical placeholder language when user-facing wording is visible
- hype-heavy product language
- mascot-like overfriendliness
- distant or premium-brand editorial tone

## Explicit non-goals

The first-pass direction should **not** drift into:
- overly childish or overly cute styling
- gamer-neon intensity
- luxury/editorial distance
- novelty-driven typography that hurts Korean readability
- production-brand-system complexity beyond what the demo needs

## Acceptance check

A future UI decision likely fits this guideline if it reads as:
- approachable on first glance
- easy to read in Korean
- visually softer than the current dark/glass baseline
- warm without being cute
- calm without being boring

## Related context
- [[Frontend Workspace Overview]]([Frontend Workspace Overview](frontend-workspace-overview.md))
- [[Frontend Stack Baseline]]([Frontend Stack Baseline](frontend-stack-baseline.md))
- [[Demo Scope Note]]([Demo Scope Note](../../output/demo-scope-note-2026-04-26.md))
- Deep interview source: [`../../../../.omx/specs/deep-interview-friendly-ui-tone-typography.md`](../../../../.omx/specs/deep-interview-friendly-ui-tone-typography.md)
