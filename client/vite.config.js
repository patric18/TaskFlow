import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.js'],
    css: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/main.jsx',
        'src/App.jsx',
        'src/pages/**',
        'src/components/kanban/**',
        'src/components/layout/**',
        'src/components/onboarding/**',
        'src/components/notifications/**',
        'src/components/projects/**',
        'src/components/billing/**',
        'src/components/ui/Avatar.jsx',
        'src/components/ui/Badge.jsx',
        'src/components/ui/EmptyState.jsx',
        'src/components/ui/Skeleton.jsx',
        'src/components/ui/Textarea.jsx',
        'src/components/theme/ThemeProvider.jsx',
        'src/components/theme/ThemeSelector.jsx',
        'src/hooks/useTasks.js',
        'src/hooks/useProjects.js',
        'src/hooks/useComments.js',
        'src/hooks/useTeam.js',
        'src/hooks/useBilling.js',
        'src/hooks/useNotifications.js',
        'src/hooks/useOrganizations.js',
        'src/hooks/useOrganizationMembers.js',
        'src/hooks/useAuth.js',
        'src/api/**',
        'src/store/orgStore.js',
        'src/components/ui/RichTextEditor.jsx',
        'src/components/ui/Modal.jsx',
        'src/**/index.js',
        'src/__tests__/**',
      ],
      thresholds: {
        lines: 80,
      },
    },
  },
});
