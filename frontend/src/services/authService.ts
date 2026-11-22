import { api } from './api';
import type { User } from '../stores/authStore';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface RegisteredUser {
  id: string;
  username: string;
  name: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
}

export type CurrentUser = Omit<User, 'role'>;

export interface UpdateProfilePayload {
  name?: string;
  bio?: string;
  avatar_url?: string;
  pronouns?: string;
  default_city?: string;
}

export const authService = {
  // Login with credentials
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', payload);
    return response.data;
  },

  // Register a new user
  async register(payload: RegisterPayload): Promise<RegisteredUser> {
    const response = await api.post<RegisteredUser>('/users/register', payload);
    return response.data;
  },

  // Get current authenticated user profile
  async getMe(accessToken?: string): Promise<CurrentUser> {
    const response = await api.get<CurrentUser>('/users/me', {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    });
    return response.data;
  },

  // Update current user profile
  async updateMe(payload: UpdateProfilePayload): Promise<User> {
    const response = await api.put<User>('/users/me', payload);
    return response.data;
  },

  // Revoke session and add token to Redis blacklist
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    }
  },

  // Request password reset email
  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/reset-password', {
      token,
      new_password: newPassword,
    });
    return response.data;
  },
};
