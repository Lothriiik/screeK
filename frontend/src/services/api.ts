import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import { useAuthStore } from '../stores/authStore';
import { MOCK_MOVIES } from '../mocks/movies';
import { MOCK_CINEMAS } from '../mocks/cinemas';
import { MOCK_USER_TICKETS } from '../mocks/tickets';
import { MOCK_FEED_ACTIVITIES } from '../mocks/feed';
import { MOCK_ADMIN_USER } from '../mocks/users';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8003/api/v1';

export const IS_MOCK_MODE =
  import.meta.env.VITE_MOCK_MODE === 'true' ||
  (typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1' &&
    (!import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL.includes('localhost')));

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: IS_MOCK_MODE ? 3000 : 15000,
});

// Mock Adapter para execução 100% autônoma (Vercel / Netlify showcase)
if (IS_MOCK_MODE) {
  api.defaults.adapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    // Latência realista de 40ms para suavizar transições de tela
    await new Promise((resolve) => setTimeout(resolve, 40));

    const url = config.url || '';
    let responseData: any = { success: true };

    if (url.includes('/auth/login') || url.includes('/auth/refresh')) {
      responseData = {
        access_token: 'mock-admin-token-screek',
        refresh_token: 'mock-admin-refresh-screek',
      };
    } else if (url.includes('/auth/logout')) {
      responseData = { success: true, message: 'Sessão encerrada com sucesso.' };
    } else if (url.includes('/auth/forgot-password') || url.includes('/auth/reset-password')) {
      responseData = { message: 'Operação de recuperação simulada com sucesso (modo demo).' };
    } else if (url.includes('/users/me/tickets')) {
      responseData = MOCK_USER_TICKETS;
    } else if (url.includes('/users/me')) {
      responseData = MOCK_ADMIN_USER;
    } else if (url.includes('/users/register')) {
      responseData = { id: 'usr-admin', username: 'admin', name: 'Administrador screeK' };
    } else if (url.includes('/social/feed')) {
      responseData = MOCK_FEED_ACTIVITIES;
    } else if (url.includes('/social/posts')) {
      responseData = MOCK_FEED_ACTIVITIES[0] || { id: 'post-mock-1', success: true };
    } else if (url.includes('/admin/management/cinemas') || url.includes('/cinemas')) {
      responseData = MOCK_CINEMAS;
    } else if (url.includes('/movies/discover') || url.includes('/movies')) {
      responseData = MOCK_MOVIES;
    } else if (url.includes('/users/me/recommendations') || url.includes('/recommendations')) {
      responseData = {
        user_id: 'usr-admin',
        recommendations: MOCK_MOVIES.slice(0, 10).map((m, idx) => ({
          movie_id: Number(m.numeric_id || idx + 1),
          score: 0.95 - idx * 0.05,
          reason: 'Altamente recomendado baseado em suas sessões e favoritos.',
          movie: {
            id: Number(m.numeric_id || idx + 1),
            tmdb_id: Number(m.tmdb_id || 100 + idx),
            title: m.title,
            poster_url: m.poster_url,
            backdrop_url: m.backdrop_url,
            year: m.release_year,
            vote_average: m.global_rating,
            genres: m.genres,
          },
        })),
        algorithm: 'screek-hybrid-v2',
        id_type: 'internal',
        generated_at: new Date().toISOString(),
      };
    } else if (url.includes('/similar') && url.includes('/graph')) {
      responseData = {
        root: 1,
        id_type: 'internal',
        nodes: MOCK_MOVIES.slice(0, 6).map((m, idx) => ({
          movie_id: Number(m.numeric_id || idx + 1),
          title: m.title,
          depth: idx === 0 ? 0 : 1,
          score: idx === 0 ? 1 : 0.85,
        })),
        edges: [
          { source: 1, target: 2, score: 0.88, reason: 'Direção Wachowski' },
          { source: 1, target: 3, score: 0.82, reason: 'Estética Visual & Ação' },
        ],
      };
    } else if (url.includes('/similar')) {
      responseData = {
        movie_id: 1,
        similar_movies: MOCK_MOVIES.slice(1, 7).map((m, idx) => ({
          movie_id: Number(m.numeric_id || idx + 2),
          similarity_score: 0.92 - idx * 0.04,
          reason: 'Direção e ritmo cinematográfico semelhantes.',
          movie: {
            id: Number(m.numeric_id || idx + 2),
            tmdb_id: Number(m.tmdb_id || 200 + idx),
            title: m.title,
            poster_url: m.poster_url,
            backdrop_url: m.backdrop_url,
            year: m.release_year,
            vote_average: m.global_rating,
            genres: m.genres,
          },
        })),
        algorithm: 'content-graph',
        id_type: 'internal',
        generated_at: new Date().toISOString(),
      };
    } else if (url.includes('/import/letterboxd')) {
      responseData = {
        job_id: 'demo-job-lbxd',
        status: 'completed',
        stage: 'complete',
        processed: 48,
        total: 48,
        percent: 100,
        summary: { total: 48, success: 48, failed: 0 },
      };
    } else if (url.includes('/bookings/reserve')) {
      responseData = {
        reservation_id: 'mock-res-demo-8912',
        expires_at: new Date(Date.now() + 600000).toISOString(),
      };
    } else if (url.includes('/bookings/pay')) {
      responseData = {
        success: true,
        ticket_ids: ['TXN-20260820-8912'],
      };
    }

    return {
      data: responseData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    };
  };
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh token queue state
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor with Automatic 401 Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Don't intercept auth endpoints to avoid infinite refresh loops
    const isAuthRoute =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/users/register');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        useAuthStore.getState().logout();
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: newRefreshToken } = response.data;
        useAuthStore.getState().setTokens(access_token, newRefreshToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }
        processQueue(null, access_token);
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        useAuthStore.getState().logout();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
