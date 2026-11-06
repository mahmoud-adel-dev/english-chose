# Admin Auth, Logs, and Flexible Speech Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Secure diagnostics, repair word saving, add admin-managed Google login, and improve dictation timing.

**Architecture:** Keep the existing Next.js JWT identity system and Flutter provider architecture. Add a database-backed Google configuration and verified token exchange, role-gated local diagnostics, a lifecycle-safe dialog, and explicit speech timing policy.

**Tech Stack:** Next.js 15, Prisma/Postgres, google-auth-library, Flutter, provider, google_sign_in, speech_to_text.

**Spec:** `docs/superpowers/specs/2026-11-06-admin-auth-logs-speech-design.md`

## Global Constraints

- Do not run a production or Flutter build.
- Do not deploy, push, commit, or overwrite unrelated user changes.
- Google OAuth values must be entered through the admin panel rather than an application environment file.
- All product behavior changes use test-first development.

## Review Focus

- Student attempts direct diagnostics navigation and receives no log content.
- Dialog cancellation and successful save complete route animations without controller lifecycle assertions.
- Disabled/missing Google configuration hides login and rejects token exchange safely.
- Existing password account with the same verified Google email is linked, not duplicated.
- Long speech pauses preserve accumulated transcript and manual stop remains reliable.

---

### Task 1: Word Dialog Lifecycle

**Files:**
- Modify: `apps/mobile/lib/widgets/save_word_dialog.dart`
- Test: `apps/mobile/test/save_word_dialog_test.dart`

- [ ] Write a widget test that opens and closes the dialog and pumps the route animation without framework assertions.
- [ ] Run the test and confirm the controller lifecycle assertion fails.
- [ ] Move form state and controller ownership into a stateful dialog widget.
- [ ] Run the focused test and mobile tests.

### Task 2: Admin-only Explained Diagnostics

**Files:**
- Modify: `apps/mobile/lib/screens/profile_screen.dart`
- Modify: `apps/mobile/lib/screens/session_screen.dart`
- Modify: `apps/mobile/lib/screens/logs_screen.dart`
- Modify: `apps/mobile/lib/services/log_service.dart`
- Modify: `apps/mobile/lib/services/api_service.dart`
- Test: `apps/mobile/test/admin_logs_test.dart`
- Test: `apps/mobile/test/log_explanation_test.dart`

- [ ] Write failing tests for role gating, redaction, and HTTP/stage explanations.
- [ ] Add role guards at every entry point and inside the logs screen.
- [ ] Add structured explanations and redact sensitive fields before storage/copy.
- [ ] Run focused and full mobile tests.

### Task 3: Database-backed Google Authentication

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`
- Create: `apps/backend/prisma/migrations/20261106120000_google_auth_config/migration.sql`
- Create: `apps/backend/src/lib/auth/google-auth.ts`
- Create: `apps/backend/src/app/api/auth/google/config/route.ts`
- Create: `apps/backend/src/app/api/auth/google/route.ts`
- Create: `apps/backend/src/app/api/admin/auth/google/route.ts`
- Modify: `apps/backend/package.json`
- Test: `apps/backend/tests/google-auth.test.ts`

- [ ] Write failing policy/service tests for sanitization, disabled configuration, audience verification boundary, account linking, and new account defaults.
- [ ] Add Prisma models/fields and migration.
- [ ] Implement admin configuration, public config, verified token exchange, and JWT response.
- [ ] Run focused backend tests, TypeScript validation, and full backend tests.

### Task 4: Google Login and Admin Configuration UI

**Files:**
- Modify: `apps/mobile/pubspec.yaml`
- Modify: `apps/mobile/lib/config/api_config.dart`
- Create: `apps/mobile/lib/services/google_sign_in_service.dart`
- Modify: `apps/mobile/lib/providers/app_provider.dart`
- Modify: `apps/mobile/lib/screens/auth_screen.dart`
- Create: `apps/mobile/lib/screens/admin/google_auth_tab.dart`
- Modify: `apps/mobile/lib/screens/admin/admin_dashboard_screen.dart`
- Test: `apps/mobile/test/google_auth_ui_test.dart`

- [ ] Write failing tests for hidden/visible Google login and the admin settings form.
- [ ] Add runtime Google initialization and ID-token exchange.
- [ ] Add the Google login button and admin Authentication tab.
- [ ] Run focused and full mobile tests plus analysis.

### Task 5: Flexible Dictation

**Files:**
- Modify: `apps/mobile/lib/services/stt_service.dart`
- Modify: `apps/mobile/lib/screens/session_screen.dart`
- Test: `apps/mobile/test/stt_policy_test.dart`

- [ ] Write failing tests for five-minute duration, pause tolerance, transcript merge, and resume behavior.
- [ ] Add a testable speech timing/transcript policy and pass durations to `speech_to_text`.
- [ ] Preserve existing text when restarting and clarify listening status/manual stop in UI.
- [ ] Run all mobile and backend verification commands without building.

