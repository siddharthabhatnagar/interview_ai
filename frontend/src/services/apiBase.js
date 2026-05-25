const rawApiBase =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  '/api';

function normalizeApiBase(value) {
  const base = String(value || '').trim().replace(/\/+$/, '');

  if (!base) return '/api';
  if (base === '/api' || base.endsWith('/api')) return base;
  if (base.startsWith('http://') || base.startsWith('https://')) return `${base}/api`;

  return base;
}

export const API_BASE_URL = normalizeApiBase(rawApiBase);

export default API_BASE_URL;
