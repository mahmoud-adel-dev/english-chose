import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/providers/app_provider.dart';
import 'package:mobile/widgets/save_word_dialog.dart';
import 'package:provider/provider.dart';

void main() {
  testWidgets('closing the save word dialog keeps controllers alive through route disposal', (
    tester,
  ) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => AppProvider(),
        child: MaterialApp(
          home: Builder(
            builder: (context) => Scaffold(
              body: ElevatedButton(
                onPressed: () => showSaveWordDialog(context),
                child: const Text('Open'),
              ),
            ),
          ),
        ),
      ),
    );

    await tester.tap(find.text('Open'));
    await tester.pumpAndSettle();
    expect(find.text('Save a word'), findsOneWidget);

    await tester.tap(find.byType(TextFormField).first);
    await tester.pump();
    expect(tester.testTextInput.isVisible, isTrue);

    await tester.tap(find.text('Cancel'));
    await tester.pump();
    final transitionException = tester.takeException();
    await tester.pumpAndSettle();

    expect(transitionException, isNull);
    expect(tester.takeException(), isNull);
    expect(find.text('Save a word'), findsNothing);
  });
}
