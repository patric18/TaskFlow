import { describe, it, expect } from 'vitest';
import { cn } from '../../utils/cn.js';

describe('cn', () => {
  it('merges class names and ignores falsy values', () => {
    expect(cn('a', false && 'b', 'c')).toBe('a c');
    expect(cn('px-2', 'px-4')).toContain('px-');
  });
});
