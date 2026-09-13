export const getApiBase = (): string => {
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const host = window.location.hostname;
    // When accessed from local network IP (e.g., 192.168.x.x or phone on same Wi-Fi)
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:4000/api`;
    }
  }
  const envValue = process.env.NEXT_PUBLIC_API_URL?.trim();
  return envValue || 'http://localhost:4000/api';
};

export const API_BASE = typeof window !== 'undefined'
  ? getApiBase()
  : (process.env.NEXT_PUBLIC_API_URL?.trim() || 'http://localhost:4000/api');
