const PROD_API_URL = 'https://awards-production-13eb.up.railway.app/api';

const rawEnv = (import.meta.env.VITE_API_URL || '').trim();
export const API_BASE = rawEnv
  ? (rawEnv.replace(/\/+$/, '').endsWith('/api') ? rawEnv.replace(/\/+$/, '') : `${rawEnv.replace(/\/+$/, '')}/api`)
  : (import.meta.env.DEV ? '/api' : PROD_API_URL);

export const getAssetUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const origin = API_BASE.endsWith('/api') ? API_BASE.slice(0, -4) : API_BASE;
  if (origin && origin !== '/api') {
    return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
  }
  return url;
};

async function withStatus(res) {
  const data = await res.json().catch(() => ({}));
  data.httpStatus = res.status;
  return data;
}

export const api = {
  get: async (url) => {
    const token = localStorage.getItem('admin_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${url}`, { headers });
    if (res.status === 401 && url.includes('/admin')) {
      localStorage.removeItem('admin_token');
      window.location.href = '/admin/login';
      throw new Error('Unauthorized');
    }
    return withStatus(res);
  },

  post: async (url, data) => {
    const token = localStorage.getItem('admin_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return withStatus(res);
  },

  put: async (url, data) => {
    const token = localStorage.getItem('admin_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    return withStatus(res);
  },

  delete: async (url) => {
    const token = localStorage.getItem('admin_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'DELETE',
      headers,
    });
    return withStatus(res);
  },

  postMultipart: async (url, formData) => {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      body: formData,
    });
    return withStatus(res);
  },
};