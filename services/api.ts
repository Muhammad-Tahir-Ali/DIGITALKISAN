import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { useAuthStore } from '@/store/authStore';

const RENDER_URL = 'https://digital-kisan-api.onrender.com/api/v1';
const LOCAL_URL = Platform.OS === 'web'
  ? 'http://localhost:3000/api/v1'
  : 'http://192.168.100.30:3000/api/v1';

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || RENDER_URL;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 35000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
});

// ---------------------------------------------------------------------------
// Request interceptor — inject JWT
// ---------------------------------------------------------------------------
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Background Render recovery — after falling back to local, ping Render every
// 30 s; switch back once it responds.
// ---------------------------------------------------------------------------
let renderRetryTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleRenderRetry() {
  if (renderRetryTimer) return;
  renderRetryTimer = setTimeout(async () => {
    renderRetryTimer = null;
    try {
      await axios.get(`${RENDER_URL}/health`, { timeout: 10000 });
      // Render is back — restore it as the active backend
      api.defaults.baseURL = RENDER_URL;
    } catch {
      // Still down — keep retrying as long as we are on local
      if (api.defaults.baseURL === LOCAL_URL) scheduleRenderRetry();
    }
  }, 30000);
}

// ---------------------------------------------------------------------------
// Response interceptor — network fallback + 401 token refresh
// ---------------------------------------------------------------------------
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _localFallback?: boolean;
    };

    // No response = network error. Switch to local immediately, retry the
    // failed request against local, then start background Render recovery.
    if (!error.response && originalRequest && !originalRequest._localFallback) {
      originalRequest._localFallback = true;
      api.defaults.baseURL = LOCAL_URL;
      originalRequest.baseURL = LOCAL_URL;
      scheduleRenderRetry();
      return api(originalRequest);
    }

    // Skip refresh logic for auth endpoints themselves (login, refresh).
    // If login returns 401, pass the real error (wrong credentials) straight through.
    const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
                           originalRequest.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = Platform.OS === 'web'
          ? localStorage.getItem('refreshToken')
          : await SecureStore.getItemAsync('refreshToken');

        if (!refreshToken) throw new Error('No refresh token');

        const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken });
        const { token, refreshToken: newRefreshToken } = res.data;

        useAuthStore.getState().setTokens(token, newRefreshToken);

        if (Platform.OS === 'web') {
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', newRefreshToken);
        } else {
          await SecureStore.setItemAsync('token', token);
          await SecureStore.setItemAsync('refreshToken', newRefreshToken);
        }

        processQueue(null, token);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        if (Platform.OS === 'web') {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        } else {
          await SecureStore.deleteItemAsync('token');
          await SecureStore.deleteItemAsync('refreshToken');
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
