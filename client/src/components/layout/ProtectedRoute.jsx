import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore.js';
import { usersApi } from '../../api/auth.js';

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => Boolean(state.accessToken));
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    if (user?.onboardingCompleted === undefined) {
      usersApi
        .me()
        .then(({ data }) => setUser(data.user))
        .catch(() => {});
    }
  }, [isAuthenticated, user?.onboardingCompleted, setUser]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export function GuestRoute() {
  const isAuthenticated = useAuthStore((state) => Boolean(state.accessToken));
  const user = useAuthStore((state) => state.user);

  if (isAuthenticated) {
    const destination = user?.onboardingCompleted === false ? '/onboarding' : '/dashboard';
    return <Navigate to={destination} replace />;
  }

  return <Outlet />;
}
