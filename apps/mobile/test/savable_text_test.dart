import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/widgets/savable_text.dart';

void main() {
  test('normalizes the word selected by a learner', () {
    expect(normalizeSelectedWord(' How, '), 'how');
    expect(normalizeSelectedWord('(well-known).'), 'well-known');
    expect(normalizeSelectedWord('good morning'), isNull);
    expect(normalizeSelectedWord('123'), isNull);
  });

  testWidgets('renders learning text as selectable text', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: SavableText('How are you today?', onSaveWord: (_) async {}),
      ),
    );

    expect(find.byType(SelectableText), findsOneWidget);
    expect(find.text('How are you today?'), findsOneWidget);
  });
}
