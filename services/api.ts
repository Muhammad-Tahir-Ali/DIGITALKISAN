import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { useAuthStore } from '@/store/authStore';

// Use your machine's LAN IP so physical Android devices on the same WiFi can reach the backend.
// 10.0.2.2 only works inside the Android Emulator; localhost only works on web.
const DEV_MACHINE_IP = '192.168.100.30';

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || (__DEV__
  ? (Platform.OS === 'web'
      ? 'http://localhost:3000/api/v1'
      : `http://${DEV_MACHINE_IP}:3000/api/v1`)
  : 'https://digital-kisan-api.onrender.com/api/v1');

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
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
// Response interceptor — handle 401 with token refresh
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
    };

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

        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
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
