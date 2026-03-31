import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { Button } from '../ui/Button.jsx';
import { NotificationBell } from '../notifications/NotificationBell.jsx';
import { ThemeToggle } from '../theme/ThemeToggle.jsx';
import { Sidebar } from './Sidebar.jsx';

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          <Link to="/dashboard" className="text-lg font-semibold text-brand-600">
            TaskFlow
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <NotificationBell />
            <Link
              to="/settings/profile"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              Settings
            </Link>
            {user && (
              <span className="hidden text-sm text-gray-600 dark:text-gray-400 sm:inline">
                {user.name}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        <Sidebar />
        <main className="min-h-[calc(100vh-3.5rem)] flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
