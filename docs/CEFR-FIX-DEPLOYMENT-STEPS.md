# Apply the CEFR placement correction

This correction is source code only. It does not automatically change a running local app, GitHub repository, Vercel deployment, or Neon database.

## Files included in this build

- Backend AI routing now refuses mock output for learner evaluations and speech transcription.
- The assessment submit endpoint requires a complete, relevance-aware evaluation and applies server-side score caps.
- The seed no longer configures mock AI as a fallback.
- Regression tests cover the previously reproducible B2 result.
- The mobile assessment screen describes the test as an initial text-based diagnostic rather than an official CEFR certificate.

## Deployment checklist

1. Back up the current source/repository and create a branch such as `fix/cefr-assessment`.
2. Replace the application source with this archive, or cherry-pick the included changes into the existing repository.
3. Ensure the production AI configuration has a valid real provider for `ANSWER_EVALUATION` (Gemini is supported). The mock provider must not be configured as an evaluation fallback.
4. Deploy the backend and verify its health endpoint and server logs.
5. Build and deploy the Flutter web/mobile client so the wording changes appear in the UI.
6. Start a brand-new CEFR assessment. Completed historical assessments are not recalculated automatically.
7. Confirm the AI usage log records a real provider/model for `ANSWER_EVALUATION`, not `mock-provider` or a `mock-*` model.
8. If the real evaluator is unavailable, confirm the test reports that evaluation is temporarily unavailable and does not award a CEFR level.

## Important

Do not run database migrations against production merely to apply this CEFR correction. The CEFR correction itself adds no Prisma schema migration. The archive also contains other hardening migrations from the previous engineering pass; review and test those separately on staging before deploying them.
