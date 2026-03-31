import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,

      setAuth: ({ accessToken, user }) => set({ accessToken, user }),

      setAccessToken: (accessToken) => set({ accessToken }),

      setUser: (user) => set({ user }),

      logout: () => set({ accessToken: null, user: null }),

      isAuthenticated: () => Boolean(get().accessToken),
    }),
    {
      name: 'taskflow-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
    },
  ),
);
