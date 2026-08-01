import { format, differenceInMinutes } from 'date-fns';

/**
 * "Jun 14, 10:30 AM"
 */
export function formatDateTime(isoString: string): string {
  return format(new Date(isoString), 'MMM d, h:mm a');
}

/**
 * "10:30 AM"
 */
export function formatTime(isoString: string): string {
  return format(new Date(isoString), 'h:mm a');
}

/**
 * Minutes elapsed between startIso and endIso (defaults to now).
 * Always returns a non-negative integer.
 */
export function getDurationInMinutes(startIso: string, endIso?: string): number {
  const start = new Date(startIso);
  const end = endIso ? new Date(endIso) : new Date();
  return Math.max(0, differenceInMinutes(end, start));
}

/**
 * "1h 35m" style duration label in Hebrew, e.g. "שעה ו-35 דק'" / "45 דק'".
 */
export function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} דק'`;
  if (minutes === 0) return `${hours} שעות`;
  return `${hours} שעות ו-${minutes} דק'`;
}
