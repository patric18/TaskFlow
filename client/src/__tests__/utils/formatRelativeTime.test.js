import { describe, it, expect } from 'vitest';
import { formatRelativeTime } from '../../utils/formatRelativeTime.js';

describe('formatRelativeTime', () => {
  it('formats recent timestamps', () => {
    expect(formatRelativeTime(new Date())).toBe('just now');

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeTime(fiveMinutesAgo)).toBe('5m ago');
  });

  it('formats older timestamps as dates', () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(twoWeeksAgo)).toBe(twoWeeksAgo.toLocaleDateString());
  });
});
