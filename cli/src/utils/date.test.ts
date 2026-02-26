import { describe, it, expect } from 'vitest';
import {
  daysAgo,
  formatDate,
  formatDateTime,
  isWithinRange,
  getDateRange,
  formatDuration,
  diffInHours,
  diffInDays,
} from './date.js';

describe('date utilities', () => {
  describe('daysAgo', () => {
    it('should return a date N days ago', () => {
      const reference = new Date('2024-01-15T12:00:00Z');
      const result = daysAgo(7, reference);
      expect(result.toISOString().split('T')[0]).toBe('2024-01-08');
    });

    it('should use current date if no reference provided', () => {
      const result = daysAgo(0);
      const today = new Date();
      expect(result.toISOString().split('T')[0]).toBe(today.toISOString().split('T')[0]);
    });
  });

  describe('formatDate', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date('2024-03-15T10:30:00Z');
      expect(formatDate(date)).toBe('2024-03-15');
    });
  });

  describe('formatDateTime', () => {
    it('should format as ISO string', () => {
      const date = new Date('2024-03-15T10:30:00.000Z');
      expect(formatDateTime(date)).toBe('2024-03-15T10:30:00.000Z');
    });
  });

  describe('isWithinRange', () => {
    const start = new Date('2024-01-01');
    const end = new Date('2024-01-31');

    it('should return true for date within range', () => {
      expect(isWithinRange(new Date('2024-01-15'), start, end)).toBe(true);
    });

    it('should return true for date at start of range', () => {
      expect(isWithinRange(new Date('2024-01-01'), start, end)).toBe(true);
    });

    it('should return true for date at end of range', () => {
      expect(isWithinRange(new Date('2024-01-31'), start, end)).toBe(true);
    });

    it('should return false for date before range', () => {
      expect(isWithinRange(new Date('2023-12-31'), start, end)).toBe(false);
    });

    it('should return false for date after range', () => {
      expect(isWithinRange(new Date('2024-02-01'), start, end)).toBe(false);
    });

    it('should accept string dates', () => {
      expect(isWithinRange('2024-01-15', start, end)).toBe(true);
    });
  });

  describe('getDateRange', () => {
    it('should return start and end dates for given days', () => {
      const { start, end } = getDateRange(30);
      const diffMs = end.getTime() - start.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      expect(diffDays).toBe(30);
    });
  });

  describe('formatDuration', () => {
    it('should format minutes for less than 1 hour', () => {
      expect(formatDuration(0.5)).toBe('30m');
    });

    it('should format hours for less than 24 hours', () => {
      expect(formatDuration(5)).toBe('5.0h');
    });

    it('should format days for less than 7 days', () => {
      expect(formatDuration(48)).toBe('2.0d');
    });

    it('should format weeks for 7+ days', () => {
      expect(formatDuration(168)).toBe('1.0w');
    });
  });

  describe('diffInHours', () => {
    it('should calculate hours between two dates', () => {
      const start = new Date('2024-01-01T00:00:00Z');
      const end = new Date('2024-01-01T12:00:00Z');
      expect(diffInHours(start, end)).toBe(12);
    });

    it('should accept string dates', () => {
      expect(diffInHours('2024-01-01T00:00:00Z', '2024-01-02T00:00:00Z')).toBe(24);
    });
  });

  describe('diffInDays', () => {
    it('should calculate days between two dates', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-08');
      expect(diffInDays(start, end)).toBe(7);
    });
  });
});
