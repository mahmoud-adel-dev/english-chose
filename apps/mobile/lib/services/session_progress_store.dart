import 'package:shared_preferences/shared_preferences.dart';

class SessionProgressStore {
  static const _draftPrefix = 'practice_session_draft';

  String _draftKey(String sessionId, String questionId) =>
      '$_draftPrefix::$sessionId::$questionId';

  Future<void> saveDraft(
    String sessionId,
    String questionId,
    String draft,
  ) async {
    final preferences = await SharedPreferences.getInstance();
    final key = _draftKey(sessionId, questionId);

    if (draft.trim().isEmpty) {
      await preferences.remove(key);
      return;
    }

    await preferences.setString(key, draft);
  }

  Future<String?> loadDraft(String sessionId, String questionId) async {
    final preferences = await SharedPreferences.getInstance();
    return preferences.getString(_draftKey(sessionId, questionId));
  }

  Future<void> clearDraft(String sessionId, String questionId) async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.remove(_draftKey(sessionId, questionId));
  }
}
