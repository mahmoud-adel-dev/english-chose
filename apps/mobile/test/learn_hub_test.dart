import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:mobile/models/learn.dart';
import 'package:mobile/providers/app_provider.dart';
import 'package:mobile/screens/learn/learn_hub_screen.dart';
import 'package:mobile/screens/learn/quiz_screen.dart';

void main() {
  testWidgets('renders Learn Hub with 4 pedagogical tabs', (tester) async {
    final provider = AppProvider();

    await tester.pumpWidget(
      ChangeNotifierProvider.value(
        value: provider,
        child: const MaterialApp(
          home: LearnHubScreen(),
        ),
      ),
    );
    await tester.pump();

    expect(find.text('القواعد (Grammar)'), findsOneWidget);
    expect(find.text('اختبار 50 سؤال (Exam)'), findsOneWidget);
    expect(find.text('قوة النطق (Pronunciation)'), findsOneWidget);
    expect(find.text('قوة الاستماع (Listening)'), findsOneWidget);
  });

  testWidgets('renders 50-Question Quiz Screen and tracks option selection', (tester) async {
    const sampleQuiz = QuizModel(
      quizId: 'test-quiz-1',
      title: '50-Question Mastery Test',
      titleArabic: 'اختبار الـ 50 سؤال الحي',
      level: 'B1',
      totalQuestions: 50,
      createdAt: '2026-11-06T20:00:00Z',
      questions: [
        QuizQuestionModel(
          id: 'q-1',
          questionNumber: 1,
          prompt: 'She _____ to work every day.',
          options: ['go', 'goes', 'going', 'is go'],
          correctIndex: 1,
          explanation: 'Third person singular takes goes in Present Simple.',
          topicId: 'a1-present-simple',
          level: 'A1',
        ),
      ],
    );

    await tester.pumpWidget(
      const MaterialApp(
        home: QuizScreen(quiz: sampleQuiz),
      ),
    );
    await tester.pump();

    expect(find.textContaining('QUESTION 1 OF 1'), findsOneWidget);
    expect(find.text('She _____ to work every day.'), findsOneWidget);
    expect(find.text('goes'), findsOneWidget);

    // Tap option B ('goes')
    await tester.tap(find.text('goes'));
    await tester.pump();

    // Verify explanation shows up
    expect(find.textContaining('Explanation'), findsOneWidget);
    expect(find.text('Third person singular takes goes in Present Simple.'), findsOneWidget);
  });
}
