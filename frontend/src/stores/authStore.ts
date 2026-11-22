import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'USER' | 'MANAGER' | 'ADMIN';

export interface User {
  id: string;
  username: string;
  name?: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  bio?: string;
  pronouns?: string;
  default_city?: string;
  is_active?: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken?: string) => void;
  updateUser: (data: Partial<User>) => void;
  logout: () => void;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}

const initialAuth = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialAuth,

      setAuth: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),

      setTokens: (accessToken, refreshToken) =>
        set((state) => ({
          accessToken,
          refreshToken: refreshToken || state.refreshToken,
          isAuthenticated: Boolean(accessToken),
        })),

      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),

      logout: () =>
        set(initialAuth),

      hasRole: (role) => {
        const currentUser = get().user;
        if (!currentUser) return false;
        if (Array.isArray(role)) {
          return role.includes(currentUser.role);
        }
        return currentUser.role === role;
      },
    }),
    {
      name: 'screek-auth',
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<AuthState> | undefined;
        if (
          persisted?.accessToken === 'development-token' ||
          persisted?.user?.id === 'dev-user'
        ) {
          return currentState;
        }

        return { ...currentState, ...persisted };
      },
    }
  )
);
