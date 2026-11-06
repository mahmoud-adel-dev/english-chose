import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/screens/logs_screen.dart';

void main() {
  testWidgets('a non-admin cannot view diagnostic log content', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(home: LocalLogsScreen(isAdmin: false)),
    );

    expect(find.text('Diagnostic Logs'), findsNothing);
    expect(find.text('Administrator access required'), findsOneWidget);
  });
}
