const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const normalizeUrl = (url: string): string => url.trim().replace(/\/+$/, '');

const isEphemeralTunnel = (url: string): boolean =>
  ['.trycloudflare.com', '.loca.lt', '.lhr.life'].some((host) => {
    try {
      return new URL(url).hostname.endsWith(host);
    } catch {
      return false;
    }
  });

export const getApiBaseUrl = (): string => {
  const saved = localStorage.getItem('API_BASE_URL');

  if (saved) {
    // Browsers block HTTP API and WebSocket traffic from an HTTPS page. If the
    // stale saved value is localhost, prefer the HTTPS deployment URL.
    if (
      typeof window !== 'undefined' &&
      window.location.protocol === 'https:' &&
      saved.startsWith('http://localhost') &&
      import.meta.env.VITE_API_URL
    ) {
      return normalizeUrl(import.meta.env.VITE_API_URL);
    }

    // Quick-tunnel hostnames change whenever the tunnel is recreated. Do not
    // let a stale value from an older deployment override the current build's
    // configured tunnel URL.
    if (
      import.meta.env.VITE_API_URL &&
      normalizeUrl(saved) !== normalizeUrl(import.meta.env.VITE_API_URL) &&
      isEphemeralTunnel(saved)
    ) {
      return normalizeUrl(import.meta.env.VITE_API_URL);
    }

    return normalizeUrl(saved);
  }

  return normalizeUrl(DEFAULT_API_BASE_URL);
};

export const setApiBaseUrl = (url: string): void => {
  localStorage.setItem('API_BASE_URL', normalizeUrl(url));
};

export const resetApiBaseUrl = (): string => {
  localStorage.removeItem('API_BASE_URL');
  return getApiBaseUrl();
};
