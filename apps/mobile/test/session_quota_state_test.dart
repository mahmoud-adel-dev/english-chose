import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/widgets/quota_limit_notice.dart';

void main() {
  testWidgets('shows a clear renewal state instead of an error', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: QuotaLimitNotice(
            resetsAtUtc: '2026-11-07T00:00:00Z',
            now: () => DateTime.parse('2026-11-06T23:00:00Z'),
          ),
        ),
      ),
    );

    expect(find.text('Daily sessions completed'), findsOneWidget);
    expect(find.textContaining('01:00:00'), findsOneWidget);
    expect(find.text('Something went wrong'), findsNothing);
  });

  testWidgets('malformed reset timestamp stays user friendly', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: QuotaLimitNotice(
            resetsAtUtc: 'invalid',
            now: () => DateTime.utc(2026),
          ),
        ),
      ),
    );

    expect(find.textContaining('next daily reset'), findsOneWidget);
  });
}
