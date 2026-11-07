# Mobile Auth and Google Sign-In Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix Google authentication on Flutter Web and deliver a polished mobile-first auth screen without demo login shortcuts.

**Architecture:** Add a platform-aware Google authentication boundary: native platforms keep interactive `authenticate()`, while Web initializes with `clientId`, renders the official GIS button, and consumes authentication events. Keep the existing backend ID-token exchange and reshape only the Flutter auth UI.

**Tech Stack:** Flutter, Dart, Provider, google_sign_in 7.2.0, google_sign_in_web 1.1.3, flutter_test

**Spec:** `docs/superpowers/specs/2026-11-07-mobile-auth-google-signin-design.md`

## Global Constraints

- Keep the Web Client ID sourced from the existing public backend configuration endpoint.
- Do not expose client secrets or move backend authentication logic into Flutter.
- Keep a centered single-column auth layout, optimized for mobile.
- Remove demo credentials and quick-login controls.

## Review Focus

- Empty or disabled Web Client ID must show a configuration state and must not initialize GIS.
- Web authentication events with no ID token must show a friendly error.
- Google cancellation must not expose raw exception strings or package paths.
- Switching between Sign In and Register must preserve correct validation and clear stale errors.
- Narrow screens and the on-screen keyboard must remain scrollable without overflow.

---

### Task 1: Platform-aware Google authentication

**Files:**
- Modify: `apps/mobile/lib/services/google_sign_in_service.dart`
- Create: `apps/mobile/lib/widgets/google_sign_in_web_button.dart`
- Create: `apps/mobile/lib/widgets/google_sign_in_web_button_stub.dart`
- Modify: `apps/mobile/lib/widgets/google_sign_in_button.dart`
- Modify: `apps/mobile/lib/providers/app_provider.dart`
- Test: `apps/mobile/test/google_auth_ui_test.dart`

**Interfaces:**
- Consumes: public `{ enabled, webClientId }` Google configuration and existing `AppProvider` backend token exchange.
- Produces: a platform-appropriate Google control that returns an ID token to `AppProvider.loginWithGoogleIdToken(String idToken)`.

- [ ] **Step 1: Write failing widget and service-boundary tests**

Add tests proving the enabled Google control is rendered, the disabled state remains non-interactive, a supplied Web ID token is passed to the provider boundary, and raw assertion text is converted to friendly copy.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `flutter test test/google_auth_ui_test.dart`

Expected: FAIL because the Web-specific control/token boundary and friendly error behavior do not exist.

- [ ] **Step 3: Implement the minimal platform split**

Initialize Web with `clientId`, subscribe once to `GoogleSignIn.instance.authenticationEvents`, render GIS through `google_sign_in_web`'s `renderButton`, and keep `authenticate()` only for supported native platforms. Route both paths through the same backend ID-token exchange method.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `flutter test test/google_auth_ui_test.dart`

Expected: all Google auth UI tests pass.

### Task 2: Mobile-first auth screen cleanup

**Files:**
- Modify: `apps/mobile/lib/screens/auth_screen.dart`
- Modify: `apps/mobile/lib/widgets/google_sign_in_button.dart`
- Test: `apps/mobile/test/widget_test.dart`
- Test: `apps/mobile/test/google_auth_ui_test.dart`

**Interfaces:**
- Consumes: the Google control produced by Task 1 and existing `AppProvider.login/register` methods.
- Produces: a responsive single-column Sign In/Register screen with empty fields, no demo actions, and friendly inline states.

- [ ] **Step 1: Write failing mobile auth widget tests**

Assert that demo labels and pre-filled credentials are absent, Sign In/Register switching works, narrow viewport rendering has no overflow, and the primary actions remain visible.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `flutter test test/widget_test.dart test/google_auth_ui_test.dart`

Expected: FAIL because demo controls/default credentials are present and the refreshed mobile layout is absent.

- [ ] **Step 3: Implement the mobile-first visual refresh**

Use an uncluttered background, compact branded header, refined segmented switch, consistent 48–52px controls, improved spacing and error card, empty controllers, and no demo-login section. Preserve single-column desktop behavior.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `flutter test test/widget_test.dart test/google_auth_ui_test.dart`

Expected: all focused auth tests pass.

### Task 3: Verification and operator guidance

**Files:**
- Modify: `apps/mobile/README.md`

**Interfaces:**
- Consumes: completed auth implementation.
- Produces: documented stable local Web origin and verified Flutter build quality.

- [ ] **Step 1: Document Google Web local setup**

Document `flutter run -d chrome --web-hostname localhost --web-port 7357` and the matching `http://localhost:7357` Authorized JavaScript origin.

- [ ] **Step 2: Run formatting and static analysis**

Run: `dart format lib test && flutter analyze`

Expected: no analyzer issues.

- [ ] **Step 3: Run the complete mobile test suite**

Run: `flutter test`

Expected: all tests pass; report any unrelated pre-existing failure by name.

- [ ] **Step 4: Build Flutter Web**

Run: `flutter build web`

Expected: exit code 0 and generated Web bundle.
