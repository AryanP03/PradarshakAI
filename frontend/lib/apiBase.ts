export const getApiBase = (): string => {
  const envValue = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envValue) {
    return envValue.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const host = window.location.hostname;
    // Only apply dynamic host substitution for actual local network / LAN IPs (e.g. 192.168.x.x, 10.x.x.x)
    const isLanIp =
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(host);

    if (isLanIp) {
      return `http://${host}:4000/api`;
    }
  }

  return 'http://localhost:4000/api';
};

export const API_BASE = typeof window !== 'undefined'
  ? getApiBase()
  : (process.env.NEXT_PUBLIC_API_URL?.trim()?.replace(/\/+$/, '') || 'http://localhost:4000/api');

