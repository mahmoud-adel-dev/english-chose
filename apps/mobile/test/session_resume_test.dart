import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/services/session_progress_store.dart';
import 'package:mobile/services/session_resume_policy.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test('resumes at the first question without a submission', () {
    expect(findResumeQuestionIndex([1, 2, 0, 0]), 2);
    expect(findResumeQuestionIndex([0, 0, 0]), 0);
  });

  test('keeps the last question selected when every question was answered', () {
    expect(findResumeQuestionIndex([1, 1, 1]), 2);
    expect(findResumeQuestionIndex([]), 0);
  });

  test('persists and clears a draft for a specific session question', () async {
    SharedPreferences.setMockInitialValues({});
    final store = SessionProgressStore();

    await store.saveDraft('session-1', 'question-2', 'My unfinished answer');
    expect(
      await store.loadDraft('session-1', 'question-2'),
      'My unfinished answer',
    );
    expect(await store.loadDraft('session-1', 'question-3'), isNull);

    await store.clearDraft('session-1', 'question-2');
    expect(await store.loadDraft('session-1', 'question-2'), isNull);
  });
}
