/**
 * Get a date N days ago from now (or from a reference date)
 */
export function daysAgo(days: number, from: Date = new Date()): Date {
  const date = new Date(from);
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * Format a date as ISO string (YYYY-MM-DD)
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Format a date as ISO datetime string
 */
export function formatDateTime(date: Date): string {
  return date.toISOString();
}

/**
 * Parse an ISO date string to a Date object
 */
export function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}

/**
 * Check if a date is within a range
 */
export function isWithinRange(date: Date | string, start: Date, end: Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d >= start && d <= end;
}

/**
 * Get the start and end dates for a given number of days
 */
export function getDateRange(days: number): { start: Date; end: Date } {
  const end = new Date();
  const start = daysAgo(days, end);
  return { start, end };
}

/**
 * Format duration in hours to a human-readable string
 */
export function formatDuration(hours: number): string {
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes}m`;
  }
  if (hours < 24) {
    return `${hours.toFixed(1)}h`;
  }
  const days = hours / 24;
  if (days < 7) {
    return `${days.toFixed(1)}d`;
  }
  const weeks = days / 7;
  return `${weeks.toFixed(1)}w`;
}

/**
 * Calculate the difference between two dates in hours
 */
export function diffInHours(start: Date | string, end: Date | string): number {
  const startDate = typeof start === 'string' ? new Date(start) : start;
  const endDate = typeof end === 'string' ? new Date(end) : end;
  return (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
}

/**
 * Calculate the difference between two dates in days
 */
export function diffInDays(start: Date | string, end: Date | string): number {
  return diffInHours(start, end) / 24;
}

/**
 * Get the start of a day (midnight)
 */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the end of a day (23:59:59.999)
 */
export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
