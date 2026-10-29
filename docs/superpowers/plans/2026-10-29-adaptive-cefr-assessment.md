# Adaptive CEFR Assessment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver an English-only, abuse-resistant, adaptive CEFR placement assessment with fail-closed AI evaluation.

**Architecture:** A shared backend policy module validates answers, normalizes scores, and chooses adjacent CEFR difficulty. Assessment and daily-session routes use that module before persistence. Flutter provides immediate English-only input feedback, while the API remains the security boundary.

**Tech Stack:** Next.js 15, TypeScript, Vitest, Prisma, Flutter/Dart

**Spec:** `docs/superpowers/specs/2026-10-29-adaptive-cefr-assessment-design.md`

## Global Constraints

- Keep all existing API paths and database schema unchanged.
- Reject Arabic and gibberish before invoking AI or writing submissions.
- Never synthesize a passing evaluation when AI evaluation is unavailable.
- Do not modify unrelated dirty files.

## Review Focus

- Arabic mixed with English must be rejected by the API and blocked in Flutter.
- Repeated letters and low-variety random tokens must not advance an assessment.
- Punctuation-only and undersized responses must be rejected.
- Scores outside 0-100 or malformed AI JSON must never reach persistence.
- A failed AI provider must leave the current question and profile unchanged.

---

### Task 1: Shared answer policy

**Files:**
- Create: `apps/backend/src/lib/assessment/answer-policy.ts`
- Test: `apps/backend/tests/answer-policy.test.ts`

**Interfaces:**
- Produces: `validateEnglishAnswer(text, targetLevel)`, `nextAdaptiveLevel(level, score)`, and `normalizeScore(value)`.

- [ ] Write failing tests for Arabic, gibberish, short input, valid English, score bounds, and adaptive boundaries.
- [ ] Run the focused test and confirm RED.
- [ ] Implement the minimal policy and confirm GREEN.

### Task 2: Adaptive placement API

**Files:**
- Modify: `apps/backend/src/app/api/assessment/start/route.ts`
- Modify: `apps/backend/src/app/api/assessment/[id]/submit/route.ts`
- Test: `apps/backend/tests/answer-policy.test.ts`

**Interfaces:**
- Consumes: Task 1 policy functions.
- Produces: B1 starting item, adaptive next item, validated bounded evaluation, and fail-closed errors.

- [ ] Add policy tests that pin the B1 start and adjacent-level decisions.
- [ ] Replace fixed progression with the adaptive level decision.
- [ ] Validate before AI and return 400 without advancing for invalid input.
- [ ] Return 503 without persistence when evaluation is unavailable or malformed.
- [ ] Compute the final level from demonstrated item difficulty and performance.

### Task 3: Daily-session evaluation safety

**Files:**
- Modify: `apps/backend/src/app/api/sessions/[sessionId]/questions/[questionId]/submit/route.ts`

**Interfaces:**
- Consumes: Task 1 validation and score normalization.
- Produces: no optimistic default score and no profile mutation on invalid/unavailable evaluation.

- [ ] Validate input before quota consumption where possible and before AI.
- [ ] Remove the default 80/pass evaluation.
- [ ] Enforce server-derived `isPassed` from a normalized overall score.
- [ ] Return 503 and refund quota when no trustworthy evaluation exists.

### Task 4: Flutter English-only assessment input

**Files:**
- Modify: `apps/mobile/lib/screens/assessment_screen.dart`
- Modify: `apps/mobile/lib/screens/session_screen.dart`
- Test: `apps/mobile/test/english_answer_input_test.dart`

**Interfaces:**
- Produces: reusable English input formatter and clear validation copy.

- [ ] Add formatter tests for Arabic rejection and English punctuation acceptance.
- [ ] Add the formatter and apply it to assessment and session text fields.
- [ ] Hide the per-question level badge and describe the test as adaptive.
- [ ] Run Flutter analyze and tests.

### Task 5: Verification and report

- [ ] Run focused backend tests, the backend suite, Flutter analyze, and Flutter tests.
- [ ] Record unrelated existing failures separately from introduced failures.
- [ ] Summarize completed behavior, deployment steps, and remaining limitations.
