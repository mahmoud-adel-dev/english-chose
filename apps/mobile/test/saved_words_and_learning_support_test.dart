import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/providers/app_provider.dart';

void main() {
  group('Learning support and vocabulary state', () {
    test('initializes with empty saved words and clear support state', () {
      final provider = AppProvider();
      expect(provider.savedWords, isEmpty);
      expect(provider.learningSupportContent, isNull);
    });

    test('clearLearningSupport resets content and notifies listeners', () {
      final provider = AppProvider();
      var notified = false;
      provider.addListener(() => notified = true);

      provider.clearLearningSupport();
      expect(provider.learningSupportContent, isNull);
      expect(notified, isTrue);
    });
  });
}
