import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/screens/admin/google_auth_tab.dart';
import 'package:mobile/widgets/google_sign_in_button.dart';

void main() {
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
