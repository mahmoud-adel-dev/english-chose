Duration? quotaResetRemaining(String? resetsAtUtc, DateTime now) {
  if (resetsAtUtc == null) return null;
  final reset = DateTime.tryParse(resetsAtUtc)?.toUtc();
  if (reset == null) return null;

  final remaining = reset.difference(now.toUtc());
  return remaining.isNegative ? Duration.zero : remaining;
}

String formatQuotaCountdown(Duration duration) {
  final hours = duration.inHours.toString().padLeft(2, '0');
  final minutes = (duration.inMinutes % 60).toString().padLeft(2, '0');
  final seconds = (duration.inSeconds % 60).toString().padLeft(2, '0');
  return '$hours:$minutes:$seconds';
}
