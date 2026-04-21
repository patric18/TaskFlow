import { describe, it, expect } from 'vitest';
import { validateEmail, validatePassword, validateName } from '../../utils/validation.js';

describe('validation utils', () => {
  it('validates email', () => {
    expect(validateEmail('')).toBe('Email is required');
    expect(validateEmail('bad')).toBe('Invalid email format');
    expect(validateEmail('user@example.com')).toBeNull();
  });

  it('validates password', () => {
    expect(validatePassword('')).toBe('Password is required');
    expect(validatePassword('short')).toBe('Password must be at least 8 characters');
    expect(validatePassword('password123')).toBeNull();
  });

  it('validates name', () => {
    expect(validateName('')).toBe('Name is required');
    expect(validateName('Jane')).toBeNull();
  });
});
