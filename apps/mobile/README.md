# mobile

A new Flutter project.

## Google Sign-In on Web

Use a stable local origin while testing Google authentication:

```bash
flutter run -d chrome --web-hostname localhost --web-port 7357
```

Add `http://localhost:7357` to the OAuth Web Client's **Authorized JavaScript origins** in Google Cloud Console. Add the deployed app origin there as well. The Web Client ID itself is configured from the app's admin Google Auth settings.

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Learn Flutter](https://docs.flutter.dev/get-started/learn-flutter)
- [Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Flutter learning resources](https://docs.flutter.dev/reference/learning-resources)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.
