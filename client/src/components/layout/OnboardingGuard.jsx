import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';

export function OnboardingGuard() {
  const user = useAuthStore((state) => state.user);

  if (user?.onboardingCompleted === false) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
