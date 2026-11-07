import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/widgets/score_card.dart';

void main() {
  testWidgets('shows an unassessed state instead of a fabricated score', (
    tester,
  ) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: ScoreCard(
            title: 'Pronunciation',
            score: 0,
            icon: Icons.hearing,
            isAssessed: false,
          ),
        ),
      ),
    );

    expect(find.text('Not assessed'), findsOneWidget);
    expect(find.text('0.0'), findsNothing);
    expect(find.text(' / 100'), findsNothing);
  });
}
