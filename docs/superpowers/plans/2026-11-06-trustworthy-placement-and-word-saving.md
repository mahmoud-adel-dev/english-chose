# Trustworthy Placement and Word Saving Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make CEFR placement reflect the learner's full set of real answers, allow an explicit self-selected starting level, and make vocabulary saving reliable from a long-pressed word.

**Architecture:** Keep the existing JWT/Prisma/Flutter architecture. Evaluation remains AI-backed but fails closed whenever only a mock result is available; a deterministic placement policy aggregates all valid item results conservatively. Profile level selection is an explicit alternative to assessment. Vocabulary migrations run as a deployment step, API database failures remain distinguishable from validation failures, and a reusable Flutter selectable-text widget opens the existing save-word flow.

**Tech Stack:** Next.js 15, TypeScript, Vitest, Prisma/Postgres, Flutter/Dart

**Spec:** `docs/superpowers/specs/2026-10-29-adaptive-cefr-assessment-design.md` plus the approved 2026-11-06 user request for self-selection and long-press word saving.

## Global Constraints

- Never use mock AI output for assessment or answer evaluation.
- Reject invalid answers without advancing or changing the learner profile.
- Preserve email/password auth and all existing API paths.
- Keep every saved-word operation scoped to the authenticated user.
- Preserve unrelated dirty workspace changes.

## Review Focus

- One unusually high item must not promote a learner whose remaining answers are weak.
- An overall score below 50 must not produce A2 or higher.
- AI-provider failure must not persist a fabricated score.
- A self-selected level must drive the next daily session without pretending it was assessed.
- Missing vocabulary schema must return an operational error and be deployed before the API is considered healthy.

---

### Task 1: Placement policy and real-evaluation gate

**Files:**
- Modify: `apps/backend/src/lib/assessment/answer-policy.ts`
- Modify: `apps/backend/src/lib/ai/task-router.ts`
- Modify: `apps/backend/src/app/api/assessment/[id]/submit/route.ts`
- Test: `apps/backend/tests/answer-policy.test.ts`

**Interfaces:**
- Produces: `determineAssessedLevel(items)` and a fail-closed AI-routing decision for evaluative tasks.

- [ ] Write failing tests for conservative aggregate placement and mock rejection.
- [ ] Run focused tests and confirm the expected failures.
- [ ] Implement the smallest aggregate policy and mock-result gate.
- [ ] Run focused tests and confirm they pass.

### Task 2: Explicit learner-selected starting level

**Files:**
- Modify: `apps/backend/src/app/api/profile/route.ts`
- Modify: `apps/mobile/lib/providers/app_provider.dart`
- Modify: `apps/mobile/lib/screens/assessment_screen.dart`
- Test: `apps/backend/tests/profile-level-policy.test.ts`
- Test: `apps/mobile/test/level_selection_test.dart`

**Interfaces:**
- Produces: validated `currentLevel` profile update and a placement-screen choice between assessment and self-selection.

- [ ] Add failing policy/widget tests for valid and invalid level selection.
- [ ] Implement backend validation and the provider method.
- [ ] Add the self-selection UI and refresh the profile after saving.
- [ ] Run focused backend and Flutter tests.

### Task 3: Reliable vocabulary persistence and long-press save

**Files:**
- Modify: `apps/backend/package.json`
- Modify: `apps/backend/src/app/api/vocabulary/route.ts`
- Create: `apps/mobile/lib/widgets/savable_text.dart`
- Modify: `apps/mobile/lib/screens/session_screen.dart`
- Modify: `apps/mobile/lib/screens/saved_words_screen.dart`
- Test: `apps/backend/tests/vocabulary-validation.test.ts`
- Test: `apps/mobile/test/savable_text_test.dart`

**Interfaces:**
- Produces: production migration deployment, truthful API errors, and long-press/context-menu save from learning text.

- [ ] Write failing tests for vocabulary validation and selected-word normalization.
- [ ] Add migration deployment to the production build lifecycle and preserve database error identity.
- [ ] Extract a reusable save-word dialog and add a selectable learning-text widget.
- [ ] Replace question, support, correction, and feedback text with the reusable widget.
- [ ] Run focused tests.

### Task 4: Verification and production readiness

- [ ] Run the complete backend test suite and Flutter tests/analyzer.
- [ ] Run Prisma migration status and document the pending production migration.
- [ ] Report changed files, verified behavior, and any unrelated existing failures without claiming deployment.
