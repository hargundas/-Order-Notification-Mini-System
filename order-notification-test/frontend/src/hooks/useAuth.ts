import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { getJwtExpiryMs } from '../utils/jwt';
import { logger } from '../utils/logger';

export const useAuth = () => {
  const token = useAuthStore((state) => state.token);
  const vendorId = useAuthStore((state) => state.vendorId);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const refreshToken = useAuthStore((state) => state.refreshToken);

  const isAuthenticated = !!token && !!vendorId;

  useEffect(() => {
    if (!token) return;

    const expiryMs = getJwtExpiryMs(token);
    if (expiryMs === null) return;

    // Refresh shortly before expiry so an idle user's first action never sees
    // an expired access token. Network failures retain the existing session;
    // the request interceptor or WebSocket reconnect will retry later.
    const delayMs = Math.max(0, expiryMs - Date.now() - 15_000);
    const timer = window.setTimeout(() => {
      logger.info('AUTH_PROACTIVE_REFRESH', 'Refreshing JWT before expiry');
      void refreshToken().catch(() => undefined);
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [token, refreshToken]);

  return {
    token,
    vendorId,
    isAuthenticated,
    login,
    logout,
    refreshToken,
  };
};
