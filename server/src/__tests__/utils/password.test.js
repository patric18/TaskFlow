import { hashPassword, verifyPassword, generateSecureToken, hashToken } from '../../utils/password.js';

describe('password utils', () => {
  it('hashes and verifies passwords', async () => {
    const hash = await hashPassword('password123');
    expect(hash).not.toBe('password123');
    await expect(verifyPassword('password123', hash)).resolves.toBe(true);
    await expect(verifyPassword('wrong', hash)).resolves.toBe(false);
  });

  it('generates unique secure tokens', () => {
    const a = generateSecureToken();
    const b = generateSecureToken();
    expect(a).toHaveLength(64);
    expect(a).not.toBe(b);
  });

  it('hashes tokens deterministically', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'));
    expect(hashToken('abc')).not.toBe(hashToken('def'));
  });
});
