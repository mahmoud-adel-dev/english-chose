# Learning Support and Vocabulary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add on-demand question translation, level-aware explanation, model answers, and a user-owned saved vocabulary page.

**Architecture:** Authenticated Next.js routes invoke the existing AI router and persist vocabulary through Prisma/Neon. Flutter exposes support actions only in daily practice and adds a vocabulary navigation page. Assessment remains assistance-free.

**Tech Stack:** Next.js 15, TypeScript, Prisma/Postgres, Flutter/Dart, Vitest

**Spec:** Approved conversation design: translate/explain/model answer on demand; saved words page; no assistance during placement tests.

## Global Constraints

- Do not run a build.
- Keep AI and database credentials server-side.
- Every vocabulary query must be scoped to the authenticated user.
- Do not add support controls to the CEFR assessment screen.

## Review Focus

- A user must never read or delete another user's saved words.
- Unsupported support actions must return 400 before AI invocation.
- Model answers must be clearly labelled and user-triggered.
- Duplicate saved words must update rather than create duplicates.
- AI failure must return a controlled error rather than fabricated content.

---

### Task 1: Learning support API

- [x] Test prompt construction and action validation.
- [x] Implement the prompt policy and authenticated route.
- [x] Run focused backend tests.

### Task 2: Saved vocabulary persistence

- [x] Add Prisma model and migration.
- [x] Add authenticated list/upsert/delete routes with ownership checks.
- [x] Add mobile provider operations.

### Task 3: Flutter experience

- [x] Add translate, explain, and model-answer controls to daily practice only.
- [x] Add saved vocabulary screen and navigation item.
- [x] Run Flutter tests and analyzer without building.

### Task 4: Verification and report

- [x] Run focused backend tests, Flutter tests, and static analysis.
- [x] Record changed files, migration requirement, and existing unrelated failures.
