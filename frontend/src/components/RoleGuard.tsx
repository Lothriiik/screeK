import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore, type UserRole } from '../stores/authStore';

interface RoleGuardProps {
  allowedRoles?: UserRole[];
}

export function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const { user, accessToken } = useAuthStore();
  const location = useLocation();
  const isAuthenticated = Boolean(accessToken && user);

  if (!isAuthenticated) {
    const redirect = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />;
  }

  const canPreviewRestrictedScreens = import.meta.env.DEV && isAuthenticated;
  if (allowedRoles?.length && (!user || !allowedRoles.includes(user.role)) && !canPreviewRestrictedScreens) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}
