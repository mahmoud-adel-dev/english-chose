# Adaptive Assessment Implementation Report

Date: 2026-10-29

## Completed

- Added a shared server-side English answer policy.
- Arabic characters are rejected by both assessment and daily-session APIs.
- Repeated-letter input, keyboard noise, punctuation-only input, and answers below the CEFR-specific minimum length are rejected without advancing.
- Placement starts at B1 and selects the next question adaptively: score >= 75 moves up, 45-74 stays, and < 45 moves down.
- Per-question CEFR badges were replaced with `Adaptive difficulty` so difficulty is not shown as an earned level.
- Removed the optimistic 80/pass daily-session fallback.
- Mock AI fallback results are not accepted for assessment or profile updates.
- Invalid or unavailable AI evaluation returns 503, refunds daily-question quota, and leaves progress unchanged.
- AI scores are normalized to 0-100 and pass/fail is derived server-side.
- Written answers no longer receive a fabricated pronunciation score.
- Updated the built-in Gemini fallback from retired `gemini-2.0-flash` to stable `gemini-3.8-flash`.
- Added Flutter input formatting that removes Arabic characters while preserving normal English punctuation.
- Kept the root health route at `/` and removed its Next.js runtime warning.

## Verification

- Backend production build: passed; all API routes compiled.
- New backend policy tests: 18/18 passed.
- Root health regression test: passed.
- Flutter tests: 4/4 passed, including both English-input formatter tests.
- Full backend suite: 48 passed and 4 unrelated existing tests failed.

## Existing Issues Not Caused by This Change

- Three quota tests fail because the test database is missing a referenced quota-tier row (`UserQuotaUsage_tierId_fkey`).
- One task-router test fails because its expected fallback model fixture is absent.
- Flutter analyzer reports six deprecation notices in the existing speech-to-text service.

## Deployment Notes

1. Commit and push the changes.
2. Confirm `GEMINI_API_KEY`, `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, and `JWT_SECRET` are set on Vercel.
3. Redeploy the backend and publish/rebuild the Flutter client.
4. Start a fresh placement assessment; old in-progress assessments keep their already-created current item, then become adaptive after the next valid answer.
5. Verify Arabic and `gggggggggg` are rejected and do not change the profile.

## Future Improvements

- Grow the prompt bank so repeated assessments do not reuse the same prompt per level.
- Add calibrated reading/listening items and confidence-based stopping.
- Add Arabic translations and explanations only as a separate future feature.
