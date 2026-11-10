# Calm English Coach Redesign Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement task by task.

**Goal:** Deliver a calm blue/purple illustrated Flutter redesign, a Next.js landing page, and a signed first-release Android APK.

**Architecture:** Retain Flutter, Provider and existing APIs; add local vector illustrations and reusable theme components. Replace the root health alias with a static rendered landing page, preserve `/api/health`, and centralize optional HTTPS download URLs. Build Android with a new private signing identity outside the source archive.

**Tech Stack:** Flutter/Dart, Next.js/React/TypeScript, Prisma unchanged, Android SDK/Gradle.

**Spec:** `docs/superpowers/specs/2026-11-15-calm-redesign.md` (final amendment supersedes original palette).

## Global Constraints

- Blue and purple, calm light visual identity; preserve existing API configuration and learner data.
- No production DB access, migrations, publication, or fabricated store/download availability.
- iOS says coming soon unless `IOS_DOWNLOAD_URL` supplies an actual HTTPS store/distribution URL.
- First Android distribution: create persistent private keystore, exclude from code, deliver separately.
- Prior question-repetition findings are outside this redesign.

## Review Focus

- Small screens / large text: content must scroll without overflowing or hiding actions.
- Missing or unsafe download URL: no dead or executable download link.
- Session resumption / login errors: keep existing Provider methods and actions working.
- Distribution identity: APK must be signed; future updates need the delivered same key.
- Landing page content: do not claim real acoustic pronunciation assessment or invent testimonials/statistics.

### Task 1: Landing page and download configuration

Files: create `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `src/lib/site/downloads.ts`, `public/illustrations/coach.svg` in `apps/backend`; replace root-health test and remove root alias `src/app/route.ts`.
Interfaces: `getDownloads(env)` returns sanitized optional HTTPS `android` and `ios` links; page renders actual link or explicit unavailable state.

- [x] Write tests for HTTPS links, missing/unsafe links, and server-rendered landing + preserved API health; observe RED.
- [x] Implement page/layout/CSS and first-party vector artwork; avoid external font dependency at build.
- [x] Run relevant Vitest tests and `tsc --noEmit`; inspect rendered page at desktop and mobile widths.
- [x] Commit independently functional landing page.

### Task 2: Mobile design system and illustrated home

Files: modify `apps/mobile/lib/config/theme.dart`, `screens/home_screen.dart`, `main.dart`; create `widgets/coach_illustration.dart`, `widgets/learning_banner.dart`; add responsive widget test `test/calm_home_test.dart`.
Interfaces: `CoachIllustration({double size})`, `LearningBanner({title,subtitle,icon})`; HomeScreen retains all existing callbacks, adds optional Learn/MyWords callbacks.

- [x] Write behavioral tests: primary action, assessment action, 320px layout and long names; observe RED for new design behavior.
- [x] Implement shared theme, local CustomPainter artwork, home cards and navigation wiring.
- [x] Run targeted tests; render home/auth previews using widget golden output and inspect them.
- [x] Commit design system and home.

### Task 3: Apply identity across learner screens

Files: existing auth, assessment, practice, learn hub, saved words, profile, conversation and result widgets.
Interfaces: shared artwork/theme/banner; existing state and API methods unchanged.

- [x] Apply calm surfaces, consistent blue/purple identity and artwork to entry states and learner headers, preserving functionality.
- [x] Fix inaccurate pronunciation marketing copy without changing evaluation logic.
- [x] Run full Flutter tests and analyze; fix regressions. Verify small-screen authentication.
- [x] Commit unified learner UI.

### Task 4: Android release and handoff

Files: signing keystore/password outside repository; `docs/RELEASE.md`, Android configuration if required; `apps/backend/public/downloads/english-coach.apk` only after a real build.
Interfaces: first release signing environment already supported by Gradle; landing default APK link only when file exists in deliverable.

- [x] Install Flutter/Android prerequisites, generate first-release keystore with cryptographically random password, chmod private files.
- [x] Build signed APK; verify package/version/permissions/signature using Android tools.
- [x] Wire bundled APK as landing download; record size/checksum and installation limitations.
- [x] Build Next.js without its migration script, smoke-check landing/health and download response.
- [x] Review changes once, address material findings, package source/APK/key backup separately and persist deliverables.
