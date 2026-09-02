export const getJwtExpiryMs = (token: string): number | null => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const parsed = JSON.parse(atob(padded)) as { exp?: number };

    return typeof parsed.exp === 'number' ? parsed.exp * 1000 : null;
  } catch {
    return null;
  }
};

export const isJwtExpiring = (token: string, leadTimeMs = 15_000): boolean => {
  const expiry = getJwtExpiryMs(token);
  return expiry !== null && expiry <= Date.now() + leadTimeMs;
};

