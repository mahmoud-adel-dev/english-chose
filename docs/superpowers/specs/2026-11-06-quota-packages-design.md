# Quota UX and Admin Packages Design

## Intent

Daily limits are normal product state, not an application failure. Learners must see the practice page, their remaining allowance, and a live countdown to renewal without being offered an action the server will reject. Administrators must control quota packages from the app instead of changing source constants.

## Goals

- Treat an exhausted daily session allowance as an available-but-locked practice state.
- Disable session creation proactively when `dailySessionsRemaining` is zero.
- Show a live countdown based on the server-provided `resetsAtUtc`, and refresh quota at expiry.
- Keep genuine network/server errors visually distinct and retryable.
- Let admins list, create, edit, activate/deactivate quota tiers and edit every current quota field.
- Let admins assign a quota tier to each user.
- Make quota enforcement and the learner quota response use the user's assigned tier.

## Non-goals

- Payments, subscriptions, invoices, currencies, and app-store billing.
- Deleting tiers that may be referenced by users or usage history; deactivation is the safe lifecycle action.
- Changing or resetting usage counters from this screen.

## Constraints

- Existing `FREE` and `PREMIUM` data must remain valid.
- A user without an explicit tier falls back to the active `FREE` tier.
- Numeric limits must be finite and non-negative; names must be non-empty and unique.
- Only `ADMIN` and `SUPER_ADMIN` may access package APIs.
- The server timestamp is authoritative; the mobile app only renders the countdown.

## Approaches

1. Edit only the hard-coded `FREE` tier. Small, but it leaves `PREMIUM` and per-user assignment unusable.
2. Use today's `UserQuotaUsage.tierId` as the assignment. No schema change, but assignments disappear at the next UTC day and cannot be managed reliably.
3. Add a persistent tier relation to `User`, provide admin CRUD-style package APIs, and make quota resolution central. Chosen because it fixes the existing always-FREE behavior at its source and supports predictable administration.

## Design

`User.quotaTierId` stores the persistent assignment. A shared quota resolver returns that active tier or active `FREE`. Both quota consumption and `/api/quota` call it. `QuotaTier` gains `isActive`; active tiers can be assigned, existing assigned inactive tiers remain visible but cannot be newly assigned.

The admin dashboard gains a Packages tab. Each package editor controls name, daily questions, daily sessions, daily audio minutes, attempts per question, requests per minute, and active status. The Users tab shows a package selector that calls a dedicated assignment endpoint.

The practice screen derives a locked state from quota data before calling `sessions/start`. In that state it retains the normal practice card, disables the start button, explains the daily allowance in plain language, and displays `HH:MM:SS` until `resetsAtUtc`. At zero, it refreshes quota. A 429 race from the server triggers a quota refresh and the same locked state rather than the generic error screen.

## Failure behavior

- Missing/malformed reset time: show “Renews at the next daily reset” without crashing.
- Network failure while loading quota: keep retry available and do not claim the quota is exhausted.
- Invalid package edits: reject with field-level messages; do not partially update.
- Attempt to assign an inactive/missing tier: reject server-side.
