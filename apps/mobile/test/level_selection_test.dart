import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/widgets/assessment_level_selector.dart';

void main() {
  testWidgets('learner chooses and confirms a starting CEFR level', (
    tester,
  ) async {
    String? confirmed;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: AssessmentLevelSelector(
            initialLevel: 'A1',
            onConfirm: (level) async => confirmed = level,
          ),
        ),
      ),
    );

    expect(find.text('Choose my starting level'), findsOneWidget);
    await tester.tap(find.text('B1'));
    await tester.pump();
    await tester.tap(find.text('Start from B1'));
    await tester.pump();

    expect(confirmed, 'B1');
  });
}
