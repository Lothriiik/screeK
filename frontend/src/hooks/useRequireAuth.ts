import { useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useAuthModalStore, type AuthTab } from '../stores/authModalStore';
import { toast } from 'sonner';

/**
 * Hook to enforce authentication before executing user actions.
 * If user is authenticated, executes callback.
 * If user is a guest, opens AuthModal with optional toast message.
 */
export function useRequireAuth() {
  const { isAuthenticated } = useAuthStore();
  const { openModal } = useAuthModalStore();

  const requireAuth = useCallback(
    (action: () => void, options?: { message?: string; tab?: AuthTab }) => {
      if (isAuthenticated) {
        action();
      } else {
        if (options?.message) {
          toast.info('Autenticação necessária', {
            description: options.message,
          });
        }
        openModal(options?.tab || 'login');
      }
    },
    [isAuthenticated, openModal]
  );

  return { requireAuth, isAuthenticated };
}
