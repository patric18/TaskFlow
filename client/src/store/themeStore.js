import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const STORAGE_KEY = 'taskflow-theme';

export function applyTheme(theme) {
  const root = document.documentElement;

  if (theme === 'dark') {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }
}

/** Read persisted theme before React mounts (avoids flash). */
export function getStoredTheme() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return 'light';
    }

    const data = JSON.parse(raw);
    return data?.state?.theme === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'light',

      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },

      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        set({ theme: next });
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          applyTheme(state.theme);
        }
      },
    },
  ),
);
