# English Coach AI — Engineering Hardening Log

Date: 7 November 2026

This change set hardens the existing Flutter + Next.js + Prisma application. It does not replace the current architecture and does not run database migrations or deploy to production.

## Implemented in this change set

### AI result integrity

- Mock completion output is now restricted to non-evaluative local development when `ALLOW_MOCK_AI=true`, or non-evaluative automated tests.
- Mock output is never enabled for answer evaluation, CEFR placement, pronunciation assessment, or speech-to-text.
- Production never enables mock output, even if `ALLOW_MOCK_AI=true` is accidentally set.
- Speech transcription no longer falls back to a fixed demonstration transcript.
- Gemini transcription no longer reports a fabricated confidence or duration value when the provider does not return those measurements.
- AI evaluation now describes text-based grammar, vocabulary, relevance, coherence, and language fluency; it does not claim to acoustically measure pronunciation from a transcript.

### Learner records and progress

- Daily streaks now increment once per consecutive UTC calendar day and reset after a missed day.
- Text-only evaluation no longer updates the learner's pronunciation score.
- A data-correction migration resets historical pronunciation values that were inferred from text; the mobile UI now labels pronunciation as “Not assessed” / “N/A” until an audio-based assessment is implemented.
- Question submissions now persist the language-fluency score separately, so session summaries no longer substitute the overall score for fluency when a new submission is evaluated.
- CEFR assessment item submission is conditional and transactional, preventing duplicate concurrent submissions and partially advanced assessments.
- Daily-session question flow allows the next unanswered question or the immediately previous retry-eligible item; unique question/attempt numbers prevent duplicate concurrent attempts.
- Answer payloads are capped at 5,000 characters before AI processing.
- Question submission, learning-profile updates, and session completion are committed in one database transaction.
- Invalid answers are rejected before quota consumption.
- Per-question attempts now use the assigned quota tier's `maxAttemptsPerItem` rather than a hard-coded limit.
- A question cannot be submitted after its session is closed.
- Session-start and question-submit handlers refund quota only when that request actually consumed quota and did not persist the corresponding operation.
- Starting a session reuses an existing active session; a nullable unique active-session key prevents concurrent requests from creating multiple active sessions for one learner.
- Session completion is idempotent, and session summaries use the latest attempt with a separately stored fluency score.
- Flutter no longer fabricates an 80% session result when the finish request fails; the active session remains available for retry.

### Quota correctness

- Question, session, and audio counters use conditional database updates with the configured limit in the update predicate.
- Concurrent requests cannot all consume a final quota slot based on the same stale read.
- Quota refunds cannot decrement counters below zero.
- The first daily usage-row creation handles the unique-key race between simultaneous requests.

### Authentication and browser access

- Production JWT signing now requires `JWT_SECRET` with at least 32 bytes.
- JWT verification is restricted to HS256 and validates the identity and role claims.
- Authenticated requests reload the current account status and role from PostgreSQL, so suspended accounts and stale admin roles do not retain access through an old token.
- CORS now uses an explicit origin allowlist instead of reflecting every request origin.
- New password hashes use bcrypt cost 12.

### Seed and release safety

- The mock provider/model are inactive in production and are no longer seeded as routing fallbacks.
- The seed script no longer creates the known `Password123!` administrator/student accounts.
- Production seeding requires explicit administrator bootstrap credentials and deactivates legacy demo identities unless the legacy administrator email was explicitly chosen and its password rotated.
- Android release builds are no longer signed with the public debug keystore. A private keystore must be supplied through `key.properties` or the documented environment variables.
- Flutter Web title, app name, and description now use the English Coach brand.

## Required deployment configuration

Set these values in the backend deployment environment before production rollout:

- `JWT_SECRET`: a unique cryptographically random secret of at least 32 bytes. Changing from the old built-in development fallback will sign out sessions created with that old fallback.
- `CORS_ALLOWED_ORIGINS`: comma-separated exact browser origins, including the production Flutter Web origin and any approved preview/custom domains.
- `NEXT_PUBLIC_APP_URL`: canonical frontend origin.
- `ALLOW_MOCK_AI=false`.
- `GEMINI_API_KEY` or another real configured provider and active model routing for every AI task that must work in production.
- `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` (at least 16 characters) only when running the production seed command.

For Android release signing, provide either `apps/mobile/android/key.properties` (kept out of source control) or environment variables:

- `ANDROID_KEYSTORE_PATH`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

## Verification status and remaining work

- TypeScript syntax transpilation completed for all 93 backend TypeScript files with zero syntax diagnostics.
- Full TypeScript type-check and Vitest execution could not be completed in this environment because npm dependencies were not installed; `npm ci` timed out and the offline npm cache does not contain the required package tarballs.
- Flutter analyze/tests and Android Gradle build could not be run because Flutter/Dart SDKs are not installed in this environment.
- No production database was contacted, no migration was applied, and no deployment was performed. Four pending migrations are included: reset unverified pronunciation scores, add the nullable question-submission fluency score, enforce one active session per learner (expiring older duplicate active sessions), and normalize/enforce unique attempt numbers per question.

Still required before production approval:

1. Install dependencies and run the full backend type-check and test suite against an isolated test database.
2. Run Flutter formatting, analyzer, widget tests, and platform builds on a machine with Flutter installed.
3. Migrate token persistence from `SharedPreferences` to a platform secure-storage plugin and verify Web/native behavior.
4. Add persistent per-user/IP request-rate limiting, including login/register protection; the current `requestsPerMinute` tier field is not yet enforced.
5. Measure audio duration reliably for every accepted codec and enforce the daily audio-minute quota before processing.
6. Add end-to-end tests for account suspension/role changes, quota concurrency, provider outages, and session recovery.
7. Configure production CORS origins, JWT secret, AI credentials, administrator credentials, and Android signing secrets in deployment settings.
