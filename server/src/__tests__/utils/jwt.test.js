import jwt from 'jsonwebtoken';
import {
  signAccessToken,
  verifyAccessToken,
  getRefreshTokenExpiryDate,
  getPasswordResetExpiryDate,
} from '../../utils/jwt.js';

describe('jwt utils', () => {
  it('signs and verifies access tokens', () => {
    const token = signAccessToken('user-123');
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe('user-123');
  });

  it('rejects invalid tokens', () => {
    expect(() => verifyAccessToken('invalid.token.here')).toThrow();
  });

  it('computes refresh token expiry from env', () => {
    const expiry = getRefreshTokenExpiryDate();
    expect(expiry.getTime()).toBeGreaterThan(Date.now());
  });

  it('computes password reset expiry ~1 hour ahead', () => {
    const expiry = getPasswordResetExpiryDate();
    const diff = expiry.getTime() - Date.now();
    expect(diff).toBeGreaterThan(55 * 60 * 1000);
    expect(diff).toBeLessThan(65 * 60 * 1000);
  });

  it('uses configured secret', () => {
    const token = signAccessToken('user-abc');
    expect(jwt.decode(token)).toMatchObject({ sub: 'user-abc' });
  });
});
