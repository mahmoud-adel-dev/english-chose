/**
 * Calculate a UTC-calendar-day streak. Quota reset dates are already UTC, so
 * using the same boundary avoids a learner's streak and quota disagreeing.
 */
function utcDayNumber(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86_400_000;
}

export function calculateNextDailyStreak(
  currentStreak: number,
  lastTrainedDate: Date | null,
  now: Date = new Date()
): number {
  if (!Number.isFinite(currentStreak) || currentStreak < 0) return 1;
  if (!lastTrainedDate || Number.isNaN(lastTrainedDate.getTime())) return 1;

  const dayDifference = utcDayNumber(now) - utcDayNumber(lastTrainedDate);
  if (dayDifference === 0) return Math.max(1, Math.floor(currentStreak));
  if (dayDifference === 1) return Math.max(1, Math.floor(currentStreak)) + 1;
  return 1;
}
