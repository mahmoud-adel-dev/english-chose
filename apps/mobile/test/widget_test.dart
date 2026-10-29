import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:mobile/main.dart';
import 'package:mobile/providers/app_provider.dart';

void main() {
  testWidgets('EnglishCoachApp builds and renders authentication screen', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      ChangeNotifierProvider<AppProvider>(
        create: (_) => AppProvider(),
        child: const EnglishCoachApp(),
      ),
    );

    await tester.pumpAndSettle();

    // Verify English Coach AI title is present
    expect(find.text('English Coach AI'), findsOneWidget);
  });
}
