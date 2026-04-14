import { useEffect } from 'react';
import { applyTheme, useThemeStore } from '../../store/themeStore.js';

export function ThemeProvider({ children }) {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return children;
}
