import { create } from 'zustand';
import axios from 'axios';
import { logger } from '../utils/logger';

export interface AuthStore {
  token: string | null;
  vendorId: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const useAuthStore = create<AuthStore>((set, get) => ({
  token: localStorage.getItem('auth_token'),
  vendorId: localStorage.getItem('auth_vendor_id'),

  login: async (email: string, password: string) => {
    try {
      logger.info('AUTH_LOGIN_ATTEMPT', `Attempting login for email: ${email}`);
      const response = await axios.post<{ token: string; vendorId: string }>(
        `${API_BASE_URL}/auth/login`,
        { email, password }
      );

      const { token, vendorId } = response.data;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_vendor_id', vendorId);

      set({ token, vendorId });
      logger.info('AUTH_LOGIN_SUCCESS', `Vendor ${vendorId} logged in successfully`);
    } catch (error: any) {
      logger.error('AUTH_LOGIN_FAILED', error.response?.data?.message || error.message);
      throw error;
    }
  },

  logout: () => {
    const { vendorId } = get();
    logger.info('AUTH_LOGOUT', `Vendor ${vendorId} logged out`);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_vendor_id');
    set({ token: null, vendorId: null });
  },

  refreshToken: async () => {
    const currentToken = get().token || localStorage.getItem('auth_token');
    if (!currentToken) {
      throw new Error('No token to refresh');
    }

    try {
      logger.info('AUTH_REFRESH_ATTEMPT', 'Calling /auth/refresh silently');
      const response = await axios.post<{ token: string; vendorId: string }>(
        `${API_BASE_URL}/auth/refresh`,
        {},
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      const { token, vendorId } = response.data;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_vendor_id', vendorId);

      set({ token, vendorId });
      logger.info('AUTH_REFRESH_SUCCESS', `Token refreshed successfully for vendor ${vendorId}`);
    } catch (error: any) {
      logger.error('AUTH_REFRESH_FAILED', error.response?.data?.message || error.message);
      get().logout();
      throw error;
    }
  },
}));
