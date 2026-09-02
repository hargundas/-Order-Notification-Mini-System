import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';
import { logger } from '../utils/logger';

export const getApiBaseUrl = (): string => {
  const saved = localStorage.getItem('API_BASE_URL');
  if (saved) {
    // If on HTTPS and saved is an insecure localhost, prefer the prod URL
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && saved.startsWith('http://localhost') && import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
    return saved;
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:8080';
};

export const setApiBaseUrl = (url: string): void => {
  localStorage.setItem('API_BASE_URL', url.replace(/\/+$/, ''));
};

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true'
  },
  timeout: 10000,
});

// Flag and queue for Challenge 2 Scenario A: Silent 401 Token Refresh & Request Replay
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Injects active Bearer token and current API URL
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.baseURL = getApiBaseUrl();
    const token = useAuthStore.getState().token || localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Catches 401, queues requests, silently refreshes token, replays
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Don't intercept if no response, already retried, or auth endpoint failed
    if (
      !error.response ||
      error.response.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      logger.info('AXIOS_401_QUEUED', `Request to ${originalRequest.url} queued while token refresh in progress`);
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    logger.warn('AXIOS_401_DETECTED', `401 Unauthorized encountered on ${originalRequest.url}. Starting silent refresh.`);

    try {
      await useAuthStore.getState().refreshToken();
      const newToken = useAuthStore.getState().token;

      if (!newToken) {
        throw new Error('Refresh succeeded but token was empty');
      }

      logger.info('AXIOS_REPLAY_SUCCESS', `Replaying queued requests with renewed token`);
      processQueue(null, newToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
      }

      return apiClient(originalRequest);
    } catch (refreshError: any) {
      logger.error('AXIOS_REPLAY_FAILED', 'Silent refresh failed, rejecting queued requests');
      processQueue(refreshError, null);
      useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
