class SpeechDictationPolicy {
  static const listenFor = Duration(minutes: 5);
  static const pauseFor = Duration(seconds: 12);

  static String mergeTranscript(String existing, String recognized) {
    final left = existing.trim();
    final right = recognized.trim();
    if (left.isEmpty) return right;
    if (right.isEmpty) return left;
    if (left == right || left.endsWith(right)) return left;

    final leftWords = left.split(RegExp(r'\s+'));
    final rightWords = right.split(RegExp(r'\s+'));
    final maxOverlap = leftWords.length < rightWords.length
        ? leftWords.length
        : rightWords.length;
    var overlap = 0;
    for (var size = 1; size <= maxOverlap; size++) {
      final leftTail = leftWords
          .sublist(leftWords.length - size)
          .join(' ')
          .toLowerCase();
      final rightHead = rightWords.sublist(0, size).join(' ').toLowerCase();
      if (leftTail == rightHead) overlap = size;
    }
    return [...leftWords, ...rightWords.skip(overlap)].join(' ');
  }
}
