import { describe, it, expect, beforeEach } from 'vitest';
import { applyTheme, getStoredTheme, useThemeStore } from '../../store/themeStore.js';

describe('themeStore', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    useThemeStore.setState({ theme: 'light' });
  });

  it('applies dark theme class to document', () => {
    applyTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    applyTheme('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('toggles theme via store actions', () => {
    useThemeStore.getState().setTheme('dark');
    expect(useThemeStore.getState().theme).toBe('dark');

    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('reads stored theme from localStorage', () => {
    localStorage.setItem('taskflow-theme', JSON.stringify({ state: { theme: 'dark' }, version: 0 }));
    expect(getStoredTheme()).toBe('dark');
  });
});
