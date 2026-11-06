# Quota UX and Admin Packages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace quota errors with a live locked practice state and provide full admin control of quota packages and user assignments.

**Architecture:** Persist package assignment on `User`, centralize assigned-tier resolution in the backend, expose admin package endpoints, then consume the richer quota contract in Flutter. UI countdown logic is isolated from widgets for deterministic tests.

**Tech Stack:** Next.js route handlers, Prisma/Postgres, Vitest, Flutter/Provider, flutter_test

**Spec:** `docs/superpowers/specs/2026-11-06-quota-packages-design.md`

## Global Constraints

- No payment or billing implementation.
- Only admins access package mutation endpoints.
- Existing users without an assignment fall back to active `FREE`.
- All numeric limits are finite and non-negative.
- No release build is required.

## Review Focus

- A user without `quotaTierId` receives the FREE limits.
- An inactive tier cannot be newly assigned.
- Zero session allowance never invokes the start endpoint from the UI.
- A malformed `resetsAtUtc` does not crash the practice screen.
- Countdown expiry refreshes quota once rather than repeatedly.

---

### Task 1: Persistent tier resolution

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`
- Create: `apps/backend/prisma/migrations/20261106180000_user_quota_tier/migration.sql`
- Create: `apps/backend/src/lib/quotas/tier-resolver.ts`
- Test: `apps/backend/src/lib/quotas/tier-resolver.test.ts`
- Modify: `apps/backend/src/lib/quotas/quota-manager.ts`
- Modify: `apps/backend/src/app/api/quota/route.ts`

**Interfaces:**
- Produces: `resolveUserQuotaTier(userId: string)` used by quota consumption and reporting.

- [ ] Write failing resolver tests for assigned tier and FREE fallback.
- [ ] Run focused Vitest and confirm failure because resolver is missing.
- [ ] Add schema/migration and implement resolver; replace hard-coded FREE lookups.
- [ ] Run focused tests and backend type/build checks.

### Task 2: Admin package and assignment API

**Files:**
- Create: `apps/backend/src/lib/quotas/tier-input.ts`
- Test: `apps/backend/src/lib/quotas/tier-input.test.ts`
- Create: `apps/backend/src/app/api/admin/quota-tiers/route.ts`
- Create: `apps/backend/src/app/api/admin/quota-tiers/[id]/route.ts`
- Create: `apps/backend/src/app/api/admin/users/[id]/quota-tier/route.ts`
- Modify: `apps/backend/src/app/api/admin/users/route.ts`

**Interfaces:**
- Produces: admin list/create/update tier payloads and `{ quotaTierId }` assignment endpoint.

- [ ] Write failing validation tests for valid, negative, non-finite, and empty-name inputs.
- [ ] Run focused test and confirm expected failure.
- [ ] Implement validation and admin-authorized endpoints.
- [ ] Include assignment in admin user response and run backend suite.

### Task 3: Learner locked-state and countdown

**Files:**
- Create: `apps/mobile/lib/services/quota_countdown.dart`
- Test: `apps/mobile/test/quota_countdown_test.dart`
- Modify: `apps/mobile/lib/providers/app_provider.dart`
- Modify: `apps/mobile/lib/screens/session_screen.dart`
- Test: `apps/mobile/test/session_quota_state_test.dart`

**Interfaces:**
- Produces: safe countdown formatter and quota-exhausted UI state.

- [ ] Write failing formatter and widget tests, including malformed reset timestamp.
- [ ] Run focused tests and confirm failures.
- [ ] Implement timer lifecycle, proactive button disabling, expiry refresh, and 429 reconciliation.
- [ ] Run focused tests and Flutter analyze.

### Task 4: Admin Packages UI

**Files:**
- Create: `apps/mobile/lib/screens/admin/quota_packages_tab.dart`
- Test: `apps/mobile/test/quota_packages_tab_test.dart`
- Modify: `apps/mobile/lib/screens/admin/admin_dashboard_screen.dart`
- Modify: `apps/mobile/lib/config/api_config.dart`
- Modify: `apps/mobile/lib/providers/app_provider.dart`

**Interfaces:**
- Consumes: Task 2 admin endpoints.
- Produces: package editing tab and user package assignment controls.

- [ ] Write failing UI tests for field validation, save, active toggle, and assignment selector.
- [ ] Run focused tests and confirm failure.
- [ ] Add provider/API integration and responsive Packages tab.
- [ ] Add user tier selector and run focused tests.

### Task 5: Full verification

**Files:**
- Verify all changed files.

- [ ] Run backend tests and build/type validation.
- [ ] Run Flutter format, full tests, and analyze.
- [ ] Review authorization, migration safety, countdown lifecycle, and dirty-worktree scope.
