# Execution ledger — 2026-11-15-calm-redesign.md

- User approved execution and changed direction to calm blue/purple; first Android release confirmed.
- Original source is an uploaded ZIP, no external Git checkout; initialized isolated local work branch without touching the original ZIP.
- Execute inline to avoid another execution-method approval after the user's explicit approval.
- Shared interfaces: site download config consumed by landing; theme/artwork shared by home and learner screens. Existing API routes and Provider interfaces retained.
- Task 4 depends on Android toolchain and package mirrors; public live deployment not authorized or accessible from source ZIP alone.
- Build command ruling: invoke Prisma generate and Next build separately; never run package build script that applies production migrations.
- Task 1 complete: Next build succeeds; 10 landing/download/health tests pass. Explicit HTTPS config prevents unsafe links; no APK is advertised until present.
- Tasks 2–3: shared theme, illustration, home/navigation, learner headers and icons implemented. 40 Flutter tests pass including 320px navigation regression. Latest SDK adds deprecation notices; switching to Flutter 3.44.9 / Dart 3.12.2 matching project baseline, rather than upgrading Android tool versions.
- Build safety: Flutter cloud bot detection attempted metadata access under default environment and was rejected. Verified `CI` returns before AzureDetector in vendor source; subsequent invocations use CI=true and suppress analytics. No metadata credentials read or used.
- Visual-only edits verified by actual widget rendering; behavioral home test initially exposed a narrow AppBar overflow, fixed with Expanded/ellipsis and passed.
- Final review fixes: restored live question quota/tier, moved chat intro into scrolling messages, wrapped assessment level badges and constrained intro badges, and validated App Store/TestFlight links. Regression tests observed RED before fixes. The small-screen test additionally exposed oversized chat toolbar/actions and voice/text mode labels; fixed within the same layout pass.
- Readability ruling: treated low contrast in informational captions as material accessibility feedback; darkened caption and feature-body colors.
- Build compatibility ruling: pin Flutter3.44.9/Dart3.12.2 rather than upgrade Gradle/AGP/Kotlin; first 3.50 build correctly rejected old tool versions. Build proxy settings are execution-local and excluded from source.
- Final mobile verification: Flutter3.44.9 analyze: No issues found; full Flutter suite: 42/42 pass. Explicit visual preview export also passes and real PNGs reviewed; SVG filter units corrected after raster QA revealed a clipped character. Fonts for button/toolbar text made explicit.
- Final site verification before packaging: TypeScript passes; 15 landing/download/API-health tests pass.
- Android build progressed past tool-version/dependency setup; host had JRE only, so installed official Temurin JDK21, rather than changing application compilation requirements.
- Android packaging fix: existing plugins require compile platforms 34/35 alongside app platform36; installed matching SDK platforms. Added the two package-visibility intents explicitly required by installed speech_to_text/flutter_tts documentation for Android11+. These do not add runtime permissions.
- First signed APK build succeeded (37.1MB), signature v2 RSA3072 verified and Android manifest reports minSdk24 / target36. Artifact QA found a JNI x86_64 library without matching Flutter engine despite requested ARM targets; added explicit ABI filters and disabled Flutter's broader automatic ABI defaults, then rebuilding to verify only complete ARM runtimes ship.

- Final artifact verification: signed APK 36,924,306 bytes, only arm64-v8a/armeabi-v7a, both libapp.so and libflutter.so present per ABI; v2 signature and 16KB ZIP alignment verification pass. Min API24, target36.
- Task 4 complete: bundled verified APK into public/downloads, rebuilt Next successfully, local HTTP smoke test returns homepage200 and the real APK byte length/ZIP range signature; local font/SVG assets200, iOS coming soon. No DB migration or production deployment performed.
- Integration ruling: supplied source ZIP has no upstream Git checkout; keep local work branch and deliver updated archive/APK instead of merging or pushing an unrelated remote branch.
- Verification boundaries: 42 Flutter tests, clean Flutter analyze, 16 targeted backend tests, Next production build, HTTP download smoke test, APK signature/alignment/native-runtime checks. No physical Android device available.
