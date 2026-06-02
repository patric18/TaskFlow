import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '../../components/theme/ThemeToggle.jsx';
import { useThemeStore } from '../../store/themeStore.js';

describe('ThemeToggle', () => {
  it('toggles between light and dark mode', async () => {
    const user = userEvent.setup();
    useThemeStore.setState({ theme: 'light' });

    render(<ThemeToggle />);

    const button = screen.getByRole('button', { name: 'Switch to dark mode' });
    await user.click(button);

    expect(useThemeStore.getState().theme).toBe('dark');
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument();
  });
});
