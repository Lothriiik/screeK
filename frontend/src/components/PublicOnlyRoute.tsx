import { Navigate, Outlet, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export function PublicOnlyRoute() {
  const { accessToken, user } = useAuthStore();
  const [searchParams] = useSearchParams();

  // If already authenticated, redirect to the redirect param or /feed / /management based on role
  if (accessToken && user) {
    const redirect = searchParams.get('redirect');
    if (redirect?.startsWith('/') && !redirect.startsWith('//')) {
      return <Navigate to={redirect} replace />;
    }
    if (user.role === 'MANAGER' || user.role === 'ADMIN') {
      return <Navigate to="/management" replace />;
    }
    return <Navigate to="/feed" replace />;
  }

  return <Outlet />;
}
