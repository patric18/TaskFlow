import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.js';
import { useAuthStore } from '../store/authStore.js';

export function useAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const logoutStore = useAuthStore((state) => state.logout);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());

  const login = useCallback(
    async (credentials) => {
      const { data } = await authApi.login(credentials);
      setAuth(data);
      return data;
    },
    [setAuth],
  );

  const register = useCallback(
    async (payload) => {
      const { data } = await authApi.register(payload);
      setAuth(data);
      return data;
    },
    [setAuth],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Clear local session even if API call fails
    } finally {
      logoutStore();
      queryClient.clear();
      navigate('/login', { replace: true });
    }
  }, [logoutStore, queryClient, navigate]);

  const forgotPassword = useCallback(async (email) => {
    const { data } = await authApi.forgotPassword(email);
    return data;
  }, []);

  const resetPassword = useCallback(async (payload) => {
    const { data } = await authApi.resetPassword(payload);
    return data;
  }, []);

  return {
    accessToken,
    user,
    isAuthenticated,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
  };
}
