# Mobile Auth and Google Sign-In Design

## Intent

Make authentication clear and production-ready: Google sign-in must work on Flutter Web without exposing plugin assertions, while the sign-in and registration experience should look polished on mobile. Demo login shortcuts and pre-filled demo credentials must be removed.

## Goals

- Initialize Google Sign-In with the Web OAuth client ID using the API expected by each platform.
- On Flutter Web, use Google Identity Services' official rendered button and consume its authentication event.
- Keep the interactive native Google flow for Android and iOS.
- Send the resulting Google ID token through the existing backend `/auth/google` endpoint.
- Show concise, user-friendly authentication errors instead of raw exceptions and local package paths.
- Improve the single-column mobile layout, spacing, hierarchy, field styling, mode switch, loading states, and Google section.
- Remove both demo login buttons and remove pre-filled demo email/password values.

## Non-goals

- No split-screen desktop redesign.
- No changes to backend token verification, user creation rules, or admin Google settings storage unless testing reveals an incompatibility.
- No new authentication provider or password-reset flow.

## Constraints

- The Web Client ID continues to come from the existing public Google-auth configuration endpoint.
- The Google OAuth client must include the exact development and production origins in Google Cloud Console. Local development should use a stable port such as `http://localhost:7357`.
- Secrets remain server-side; the public Web Client ID is not a secret.

## Approaches considered

1. **Recommended and selected: platform-aware Google UI.** Use the official GIS-rendered button on Web and the existing custom/native trigger on Android/iOS. This matches `google_sign_in_web` 1.1.3 and avoids unsupported `authenticate()` calls on Web.
2. **Static client ID in `web/index.html`.** Simpler initialization, but conflicts with the existing admin-managed runtime configuration and makes environment changes require rebuilding the client.
3. **Custom OAuth popup implementation.** Gives complete visual control but duplicates security-sensitive behavior already provided by Google and adds unnecessary maintenance.

## Expected behavior

- When Google login is enabled and configured, users see a working Google control appropriate to their platform.
- When it is unavailable, users see a short configuration message rather than a clickable broken button.
- Sign-in and registration start with empty fields.
- The auth screen remains a centered single-column experience, optimized first for narrow mobile widths and still usable on desktop.
- No Demo Student or Admin Dashboard quick-login controls are rendered.
