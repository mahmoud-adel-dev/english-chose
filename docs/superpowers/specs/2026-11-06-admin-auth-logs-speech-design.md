# Admin Auth, Diagnostics, and Flexible Speech Design

## Intent

Make diagnostics private and useful to administrators, make saved-word dialogs stable, add production-shaped Google account login whose credentials are managed in the admin panel, and let learners speak naturally without a short fixed cutoff.

## Goals

- Only ADMIN and SUPER_ADMIN users can navigate to local diagnostic logs.
- Logs explain the failing stage, HTTP meaning, likely cause, and a redacted request/response trail.
- Saving a word never disposes form controllers while the dialog route is still mounted.
- Administrators configure Google OAuth client data in the database from the admin panel; Google secrets are never returned to the mobile client.
- Google ID tokens are verified by the backend against the configured audience before an account is created or linked.
- Speech dictation allows up to five minutes, tolerates longer pauses, preserves partial text, and always offers manual stop.

## Non-goals

- No deployment, Flutter APK build, or release signing in this change.
- No access to Google Drive, Contacts, or other Google APIs.
- No server-side collection of raw audio.

## Constraints

- Google OAuth values are not stored in an application environment file. Public client IDs live in Postgres; an optional client secret is encrypted at rest with the existing credential vault mechanism.
- A server encryption master key remains infrastructure configuration because database ciphertext cannot securely decrypt itself.
- Android uses the runtime Web OAuth client ID as `serverClientId`; Google Cloud must still contain the Android package name and signing SHA fingerprints.
- Existing email/password registration remains available.

## Approaches

1. **Verified Google ID token (selected):** Flutter obtains an ID token and the backend verifies its signature, issuer, expiry, and configured audience. This is the smallest secure login flow and needs no Google API key.
2. Browser authorization-code callback: supports wider OAuth scopes but requires deep links, callback lifecycle, and refresh-token storage that this app does not need.
3. Firebase Auth: convenient but would introduce another identity system and configuration surface when the app already owns JWT sessions.

## Design

The backend stores a singleton `GoogleAuthConfig` record and exposes a public endpoint containing only enabled state and Web client ID. Admin GET/PUT endpoints require admin JWTs; PUT encrypts any client secret and GET returns only a configured flag and last four characters. Google login verifies an ID token using Google's official Node library and atomically links by Google subject or verified email, creating a normal learner profile when needed.

The mobile app adds a Google button only when public configuration is enabled. It initializes `google_sign_in` once for the fetched client ID, obtains an ID token, and exchanges it for the app's existing JWT. The admin dashboard gains an Authentication tab for the client values.

Diagnostics use an admin-only wrapper and role-conditional entry points. Log entries derive a human-readable stage, status explanation, and likely cause while redacting authorization headers, passwords, tokens, secrets, and API keys.

The save-word form becomes a stateful dialog that owns and disposes its controllers after the dialog widget itself unmounts. Speech listening explicitly requests a five-minute listen window and a 12-second pause window, keeps partial results, and does not clear a learner's existing answer when listening resumes.

