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
