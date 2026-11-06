import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/services/log_service.dart';

void main() {
  test('explains authentication failures at the API response stage', () {
    final entry = LogEntry(
      id: '1',
      timestamp: DateTime(2026),
      type: LogType.apiError,
      title: 'POST /api/auth/google',
      method: 'POST',
      url: 'https://example.test/api/auth/google',
      statusCode: 401,
      isError: true,
    );

    expect(entry.stage, 'Server response');
    expect(entry.statusExplanation, contains('authentication'));
    expect(entry.likelyCause, contains('credentials'));
  });

  test('redacts nested credentials before logs retain them', () {
    const raw =
        '{"email":"a@example.com","password":"secret","idToken":"jwt","nested":{"apiKey":"key"}}';

    final safe = redactSensitiveLogData(raw);

    expect(safe, contains('a@example.com'));
    expect(safe, isNot(contains('secret')));
    expect(safe, isNot(contains('jwt')));
    expect(safe, isNot(contains('key')));
    expect(safe, contains('[REDACTED]'));
  });
}
