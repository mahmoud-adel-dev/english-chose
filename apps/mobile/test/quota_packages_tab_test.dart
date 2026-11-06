import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/screens/admin/quota_packages_tab.dart';

void main() {
  final tiers = [
    {
      'id': 'free',
      'name': 'FREE',
      'maxDailyQuestions': 15,
      'maxDailySessions': 2,
      'maxAudioMinutesDay': 10.0,
      'maxAttemptsPerItem': 3,
      'requestsPerMinute': 20,
      'isActive': true,
      '_count': {'users': 4},
    },
  ];

  testWidgets('admin can open an editor for every package limit', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: QuotaPackagesTab(
            tiers: tiers,
            onCreate: (_) async => true,
            onUpdate: (_, _) async => true,
          ),
        ),
      ),
    );

    expect(find.text('Quota Packages'), findsOneWidget);
    await tester.tap(find.byIcon(Icons.edit_rounded));
    await tester.pumpAndSettle();

    expect(find.text('Daily questions'), findsOneWidget);
    expect(find.text('Daily sessions'), findsOneWidget);
    expect(find.text('Audio minutes / day'), findsOneWidget);
    expect(find.text('Attempts / question'), findsOneWidget);
    expect(find.text('Requests / minute'), findsOneWidget);
  });

  testWidgets('package editor rejects negative limits', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: QuotaPackagesTab(
            tiers: tiers,
            onCreate: (_) async => true,
            onUpdate: (_, _) async => true,
          ),
        ),
      ),
    );
    await tester.tap(find.byIcon(Icons.add_rounded));
    await tester.pumpAndSettle();
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Daily sessions'),
      '-1',
    );
    await tester.tap(find.text('Save Package'));
    await tester.pump();
    expect(find.text('Enter zero or a positive whole number'), findsOneWidget);
  });

  testWidgets('user package selector returns the selected tier', (
    tester,
  ) async {
    String? selected;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: UserQuotaTierSelector(
            tiers: tiers,
            value: null,
            onChanged: (value) async {
              selected = value;
              return true;
            },
          ),
        ),
      ),
    );

    await tester.tap(find.byType(DropdownButtonFormField<String>));
    await tester.pumpAndSettle();
    await tester.tap(find.text('FREE').last);
    await tester.pumpAndSettle();
    expect(selected, 'free');
  });
}
