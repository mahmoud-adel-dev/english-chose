import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/services/tts_service.dart';

void main() {
  test('stop immediately reports that playback is no longer active', () async {
    final service = TtsService();
    var completed = false;
    service.onComplete = () => completed = true;

    await service.stop();

    expect(service.isSpeaking, isFalse);
    expect(completed, isTrue);
  });

  test('dispose detaches callbacks owned by the screen being closed', () async {
    final service = TtsService();
    var completed = false;
    service.onComplete = () => completed = true;

    await service.dispose();
    await service.stop();

    expect(completed, isFalse);
  });
}
