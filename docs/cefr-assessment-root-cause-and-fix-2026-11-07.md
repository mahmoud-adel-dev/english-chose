# CEFR Placement Test — Root Cause and Corrective Fix

Date: 7 November 2026

## Confirmed root cause in the uploaded source

The original `MockAiProviderAdapter` returns an `overallScore` of **82** for practically every non-Arabic answer. It does not assess whether the answer is relevant, correct, grammatical, or appropriate to the target CEFR level.

The original `AiTaskRouter` always used the mock adapter as its final fallback. The guard only rejected mock evaluation in `NODE_ENV=test`; it did not prevent the mock from generating learner scores in production. The original database seed also configured the mock model as the fallback for `ANSWER_EVALUATION` and `CEFR_ASSESSMENT`.

The placement algorithm starts at B1. A score of 82 advances the next question one level at a time. Six mock scores of 82 therefore produce target levels B1, B2, C1, C2, C2, C2, an average score of 82, and a final score cap of B2. This reproduces the reported B2 result without any genuine assessment of the learner's answers.

## Corrective changes in this build

1. Mock output is never allowed for `ANSWER_EVALUATION`, `CEFR_ASSESSMENT`, `PRONUNCIATION_ASSESSMENT`, or speech-to-text, in any environment.
2. If no real evaluator is available, the assessment endpoint returns an evaluation-unavailable response and does not save a score. It does not silently grade with mock output.
3. The seeded database routing no longer configures the mock model as a fallback.
4. CEFR evaluation now requires explicit `isOnTopic` and `isMeaningfulEnglish` flags, a relevance score, all skill scores, and an explanation.
5. Server-side score constraints cap non-meaningful responses at 10, off-topic responses at 20, weakly relevant responses at 45, and partially relevant responses at 64.
6. The server caps an overall score that contradicts the reported grammar, vocabulary, and fluency component scores.
7. The evaluator model identifier and any applied score cap are recorded in the item feedback for traceability.
8. The mobile UI no longer describes this text-transcript diagnostic as a full speaking/listening assessment or labels its result as an officially certified level.
9. Regression tests cover the old 82-point mock behavior and the new score-integrity rules.

## Verification performed for this corrective patch

- TypeScript transpilation/syntax checks passed for the changed router, assessment route, policy, and test files.
- Direct executable checks passed for off-topic score caps, non-meaningful English caps, partial-relevance caps, inconsistent component-score caps, and reproduction of the old B2 mock outcome.
- Full Vitest, Next.js production build, Flutter analyze, and Flutter tests have not been run in this environment because project dependencies and Flutter SDK are not installed here.
- No production database or deployment was modified by this patch.

## Deployment requirements

- Replace the deployed backend source with this build and redeploy it.
- Ensure a real provider is active for `ANSWER_EVALUATION` (for example, Gemini) with valid credentials.
- If no real provider is available, the test must fail safely with an evaluation-unavailable message rather than issue a level.
- Re-run the placement test after deployment. A previously stored B2 result is historical data and is not retroactively recalculated by a code deployment.

## Scope limitation

This remains a six-question adaptive diagnostic based on text transcripts. It is not a formal CEFR certification and does not independently measure listening comprehension, pronunciation, accent, or phoneme production. A future full placement assessment should include separate, validated reading, listening, writing, and speaking components and be calibrated against human-rated benchmark responses.
