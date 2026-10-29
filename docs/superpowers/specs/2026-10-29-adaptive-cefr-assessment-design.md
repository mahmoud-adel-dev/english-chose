# Adaptive CEFR Assessment Design

## Intent

Replace the fixed A1-to-C2 walkthrough and optimistic fallback scoring with a trustworthy adaptive placement flow. Invalid input must not advance the learner or affect their profile.

## Goals

- Accept English answers only and reject Arabic characters on both mobile and API boundaries.
- Reject repeated-character gibberish, low-variety random text, and answers too short to assess.
- Select the next question difficulty from the previous valid result: strong answers move up, borderline answers stay, and weak answers move down.
- Never award a passing score merely because AI evaluation failed.
- Show the final CEFR placement only after the assessment, with a useful skill breakdown.

## Non-goals

- Arabic translation or Arabic explanations.
- A psychometrically calibrated item-response-theory question bank.
- Changing the database schema or deploying production infrastructure.

## Approach

Use a pragmatic adaptive ladder over the existing CEFR prompt bank. Start at B1; a score of 75 or more raises the next item one level, 45-74 keeps it at the same level, and below 45 lowers it one level. Invalid answers return HTTP 400 and remain on the same question. Shared deterministic validation runs before AI. AI output is normalized and bounded before persistence; failures return HTTP 503 instead of a fabricated passing result.

The Flutter input formatter blocks Arabic characters while the backend remains authoritative. The per-question CEFR badge is hidden so question difficulty is not presented as an earned promotion.

## Constraints

- Preserve existing API paths and Prisma schema.
- Written answers do not receive a meaningful pronunciation score.
- Existing unrelated user changes must remain untouched.

