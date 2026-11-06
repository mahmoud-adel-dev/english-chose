import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/services/quota_countdown.dart';

void main() {
  test('formats the remaining time until the UTC quota reset', () {
    final now = DateTime.parse('2026-11-06T20:00:00Z');
    final reset = DateTime.parse('2026-11-07T00:00:05Z');

    expect(
      quotaResetRemaining(reset.toIso8601String(), now),
      const Duration(hours: 4, seconds: 5),
    );
    expect(
      formatQuotaCountdown(const Duration(hours: 4, seconds: 5)),
      '04:00:05',
    );
  });

  test('clamps an expired reset to zero', () {
    final now = DateTime.parse('2026-11-07T00:00:01Z');
    expect(quotaResetRemaining('2026-11-07T00:00:00Z', now), Duration.zero);
  });

  test('returns null for a malformed reset timestamp', () {
    expect(quotaResetRemaining('not-a-date', DateTime.utc(2026)), isNull);
  });
}
