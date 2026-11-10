import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/config/theme.dart';
import 'package:mobile/models/user.dart';
import 'package:mobile/providers/app_provider.dart';
import 'package:mobile/screens/home_screen.dart';
import 'package:provider/provider.dart';

class PreviewProvider extends AppProvider {
  @override
  UserModel get user => UserModel(
    id: 'preview',
    email: 'preview@example.invalid',
    name: 'Alexandria English Learner With A Long Name',
    role: 'STUDENT',
    createdAt: '2026-11-15',
  );
  @override
  LearningProfileModel get profile => LearningProfileModel(
    userId: 'preview',
    currentLevel: 'A2',
    targetLevel: 'B2',
    overallScore: 62,
    grammarScore: 68,
    vocabularyScore: 61,
    fluencyScore: 57,
    pronunciationScore: 0,
    dailyStreak: 3,
    recurringWeaknesses: [],
  );
  @override
  Map<String, dynamic> get quota => {
    'dailySessionsRemaining': 2,
    'dailyQuestionsRemaining': 12,
    'tierName': 'STARTER',
  };
  @override
  bool get isAdmin => false;
}

void main() {
  testWidgets(
    'home exposes practice, assessment and learn actions on a small screen',
    (tester) async {
      tester.view.physicalSize = const Size(320, 760);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      var practice = 0;
      var assessment = 0;
      var learn = 0;
      await tester.pumpWidget(
        ChangeNotifierProvider<AppProvider>.value(
          value: PreviewProvider(),
          child: MaterialApp(
            theme: AppTheme.lightTheme,
            home: HomeScreen(
              onStartPractice: () => practice++,
              onStartAssessment: () => assessment++,
              onOpenLearn: () => learn++,
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(
        find.text('A little practice. A little more confidence.'),
        findsOneWidget,
      );
      expect(find.text('12 questions left'), findsOneWidget);
      expect(find.text('STARTER plan'), findsOneWidget);
      await tester.tap(find.byKey(const Key('daily-practice')));
      expect(practice, 1);
      await tester.scrollUntilVisible(
        find.byKey(const Key('level-assessment')),
        200,
      );
      await tester.tap(find.byKey(const Key('level-assessment')));
      expect(assessment, 1);
      await tester.scrollUntilVisible(
        find.byKey(const Key('learn-library')),
        200,
      );
      await tester.tap(find.byKey(const Key('learn-library')));
      expect(learn, 1);
      expect(tester.takeException(), isNull);
    },
  );
}
