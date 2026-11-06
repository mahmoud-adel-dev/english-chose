import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/services/speech_dictation_policy.dart';

void main() {
  test('dictation allows a long answer and a natural thinking pause', () {
    expect(SpeechDictationPolicy.listenFor, const Duration(minutes: 5));
    expect(SpeechDictationPolicy.pauseFor, const Duration(seconds: 12));
  });

  test('resuming dictation preserves previous text and appends new speech', () {
    expect(
      SpeechDictationPolicy.mergeTranscript(
        'I would like',
        'to explain my answer',
      ),
      'I would like to explain my answer',
    );
  });

  test('transcript merge does not duplicate an overlapping phrase', () {
    expect(
      SpeechDictationPolicy.mergeTranscript(
        'I like learning English',
        'learning English every day',
      ),
      'I like learning English every day',
    );
  });
}
