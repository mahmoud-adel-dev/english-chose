import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/screens/admin/google_auth_tab.dart';
import 'package:mobile/services/google_sign_in_service.dart';
import 'package:mobile/widgets/google_sign_in_button.dart';

void main() {
  test('Google initialization uses clientId on web only', () {
    expect(
      googleSignInInitializationOptions(
        isWeb: true,
        webClientId: 'web.apps.googleusercontent.com',
      ),
      const GoogleSignInInitializationOptions(
        clientId: 'web.apps.googleusercontent.com',
      ),
    );
    expect(
      googleSignInInitializationOptions(
        isWeb: false,
        webClientId: 'web.apps.googleusercontent.com',
      ),
      const GoogleSignInInitializationOptions(
        serverClientId: 'web.apps.googleusercontent.com',
      ),
    );
  });

  test('raw Google plugin failures become a user-facing message', () {
    expect(
      friendlyGoogleSignInError(
        'Assertion failed: google_sign_in_web.dart ClientID not set',
      ),
      'Google sign-in is not available right now. Please try again or use your email.',
    );
  });

  test('a Google account event without an ID token is rejected', () {
    expect(() => requireGoogleIdToken(null), throwsA(isA<StateError>()));
  });

  test('blank Google client IDs are not usable', () {
    expect(isUsableGoogleClientId('   '), isFalse);
    expect(isUsableGoogleClientId('web.apps.googleusercontent.com'), isTrue);
  });

  test('Google initialization errors are reported only once', () {
    final gate = GoogleErrorNotificationGate();
    expect(gate.shouldNotify(), isTrue);
    expect(gate.shouldNotify(), isFalse);
  });

  testWidgets(
    'Google sign-in stays visible but disabled until the admin enables it',
    (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(body: GoogleSignInButton(enabled: false)),
        ),
      );
      expect(find.text('Continue with Google'), findsOneWidget);
      final disabledButton = tester.widget<OutlinedButton>(
        find.byType(OutlinedButton),
      );
      expect(disabledButton.onPressed, isNull);

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: GoogleSignInButton(enabled: true, onPressed: () {}),
          ),
        ),
      );
      expect(find.text('Continue with Google'), findsOneWidget);

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: GoogleSignInButton(enabled: true, loading: true),
          ),
        ),
      );
      expect(
        find.byWidgetPredicate(
          (widget) => widget is AbsorbPointer && widget.absorbing,
        ),
        findsOneWidget,
      );
    },
  );

  testWidgets(
    'admin can edit Google client data without seeing stored secrets',
    (tester) async {
      Map<String, dynamic>? submitted;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: GoogleAuthTab(
              configuration: const {
                'enabled': true,
                'webClientId': 'web.apps.googleusercontent.com',
                'clientSecretConfigured': true,
                'clientSecretLastFour': '1234',
              },
              onSave: (value) async {
                submitted = value;
                return true;
              },
            ),
          ),
        ),
      );

      expect(find.textContaining('ends in 1234'), findsOneWidget);
      expect(find.text('1234'), findsNothing);
      await tester.ensureVisible(find.text('Save Google settings'));
      await tester.tap(find.text('Save Google settings'));
      await tester.pump();
      expect(submitted?['webClientId'], 'web.apps.googleusercontent.com');
      expect(submitted?.containsKey('clientSecret'), isFalse);
    },
  );
}
