import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../../store/authStore.js';

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ accessToken: null, user: null });
  });

  it('stores auth session', () => {
    useAuthStore.getState().setAuth({
      accessToken: 'token-123',
      user: { id: '1', email: 'user@test.com', name: 'User' },
    });

    expect(useAuthStore.getState().isAuthenticated()).toBe(true);
    expect(useAuthStore.getState().user.email).toBe('user@test.com');
  });

  it('clears session on logout', () => {
    useAuthStore.getState().setAuth({
      accessToken: 'token-123',
      user: { id: '1', email: 'user@test.com', name: 'User' },
    });

    useAuthStore.getState().logout();
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });
});
