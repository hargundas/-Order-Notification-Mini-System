import { useAuthStore } from '../stores/authStore';

export const useAuth = () => {
  const token = useAuthStore((state) => state.token);
  const vendorId = useAuthStore((state) => state.vendorId);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const refreshToken = useAuthStore((state) => state.refreshToken);

  const isAuthenticated = !!token && !!vendorId;

  return {
    token,
    vendorId,
    isAuthenticated,
    login,
    logout,
    refreshToken,
  };
};
