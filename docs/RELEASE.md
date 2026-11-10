# English Coach — first Android release and landing page

## What changed

Calm light blue/purple visual identity, local illustrated coach, refreshed home/navigation and learner screens, consistent app icons, and a public Arabic landing page at `/`. The service health endpoint remains `/api/health`. The existing learning APIs, account system and question-generation logic are unchanged.

## Build requirements

- Flutter **3.44.9**, Dart **3.12.2** (`.fvmrc` pins the compatible Flutter line).
- Java 17 or newer, Android SDK platforms 34/35/36 (plugins use 34/35), build tools 36.0.0, NDK 28.2.13676358, CMake 3.22.1.
- Node dependencies installed from `package-lock.json`.
- Set `CI=true` and use `--suppress-analytics` for automated Flutter builds. This also avoids Flutter's automatic cloud-environment metadata probe.

## Build the Android APK

The signing backup is delivered separately. Keep it private and preserve it for every update of this application ID. Its alias is `english-coach`. Load its passwords from a local secret manager or private shell environment; do not write them into source control.

Required signing environment variables:

```
ANDROID_KEYSTORE_PATH
ANDROID_KEYSTORE_PASSWORD
ANDROID_KEY_ALIAS
ANDROID_KEY_PASSWORD
```

Run inside `apps/mobile`:

```sh
CI=true flutter --suppress-analytics pub get
CI=true flutter --suppress-analytics analyze
CI=true flutter --suppress-analytics test
CI=true flutter --suppress-analytics build apk --release --target-platform android-arm,android-arm64
```

Expected APK: `apps/mobile/build/app/outputs/flutter-apk/app-release.apk`.
The release supports 32-bit and 64-bit ARM Android phones. The explicit Gradle ABI filters also keep JNI plugin libraries consistent with these Flutter targets. It is not an iOS installation file and does not target x86 emulators. Android 7.0 (API24) or newer is required.

Before future releases, increment the build number in `apps/mobile/pubspec.yaml`. Preserve `com.englishcoach.mobile` and the signing key. If Google Sign-In is enabled, configure the Android OAuth client with this package name and the certificate SHA-1 from the release manifest; the signing key itself must never be uploaded to Google OAuth configuration.

## Website and Android download

Copy the verified signed APK to `apps/backend/public/downloads/english-coach.apk`. Build the backend afterwards: the static landing page detects whether this file exists at build time. The source delivery includes this file only if the APK build succeeded.

Alternatively configure `ANDROID_DOWNLOAD_URL` with a persistent HTTPS APK URL and rebuild. The URL is operator-supplied; verify that it actually serves the desired release. Missing files/URLs produce an explicit unavailable state.

`IOS_DOWNLOAD_URL` accepts App Store app listings or TestFlight join links. Without a valid link, iOS visibly says «قريبًا». No iOS binary or App Store publication is included in this release.

The page is statically generated, so changing download environment variables or adding a file requires a rebuild/redeployment.

## Verify the backend without changing the production database

From the repository root:

```sh
npm ci
npm exec --workspace=apps/backend -- prisma generate
npm exec --workspace=apps/backend -- tsc --noEmit
npm test --workspace=apps/backend -- tests/site-downloads.test.ts tests/landing-page.test.ts tests/root-health.test.ts
npm exec --workspace=apps/backend -- next build
```

The existing `npm run build` script includes `prisma migrate deploy`. Review deployment database/migration settings before using it; the local verification above deliberately does not apply migrations or contact the production database.

## Deploy

This delivery changes the source, not the currently hosted site. Publish the updated source through the existing GitHub/Vercel setup. Ensure Vercel's project root is `apps/backend` and that the APK is included or `ANDROID_DOWNLOAD_URL` is configured. Existing server-side API secrets remain in the hosting platform; no secrets are bundled in the APK or website source.

## Verification boundaries

Preview screenshots use sample learner data only and do not access a real account. APK signature/package checks and automated tests do not substitute for installing on a physical Android phone and exercising microphone, speech services, login and actual AI-provider availability.
