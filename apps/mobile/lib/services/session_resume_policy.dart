int findResumeQuestionIndex(List<int> attemptsUsed) {
  if (attemptsUsed.isEmpty) return 0;

  final firstUnanswered = attemptsUsed.indexWhere((attempts) => attempts == 0);
  return firstUnanswered == -1 ? attemptsUsed.length - 1 : firstUnanswered;
}
