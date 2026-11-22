import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore, type UserRole } from '../stores/authStore';
import { useAuthModalStore } from '../stores/authModalStore';

interface RoleGuardProps {
  allowedRoles?: UserRole[];
}

export function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const { user, accessToken } = useAuthStore();
  const openModal = useAuthModalStore((state) => state.openModal);
  const isAuthenticated = Boolean(accessToken && user);

  useEffect(() => {
    if (!isAuthenticated) openModal('login');
  }, [isAuthenticated, openModal]);

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex min-h-[45vh] max-w-xl flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-xl font-black uppercase">Entre para acessar esta área</h1>
        <p className="text-sm text-foreground/60">O restante do catálogo continua disponível sem login.</p>
        <button type="button" onClick={() => openModal('login')} className="border-2 border-primary bg-primary px-5 py-2 text-sm font-black uppercase text-primary-foreground">
          Fazer login
        </button>
      </div>
    );
  }

  // If specific roles required and user doesn't have permission, redirect to 403 Forbidden
  if (allowedRoles && allowedRoles.length > 0 && (!user || !allowedRoles.includes(user.role))) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}
