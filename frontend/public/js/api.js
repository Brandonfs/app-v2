const API_BASE = '/api';

const storage = {
  saveSession(data) {
    localStorage.setItem('qrassist_token', data.token);
    localStorage.setItem('qrassist_user', JSON.stringify(data.user));
  },
  getToken() {
    return localStorage.getItem('qrassist_token');
  },
  getUser() {
    const raw = localStorage.getItem('qrassist_user');
    return raw ? JSON.parse(raw) : null;
  },
  clear() {
    localStorage.removeItem('qrassist_token');
    localStorage.removeItem('qrassist_user');
  }
};

const request = async (url, options = {}) => {
  const token = storage.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: 'Error inesperado.' }));
    throw new Error(payload.message || 'Error de API.');
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response;
};

const formatDateTime = (isoDate) => new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  dateStyle: 'short',
  timeStyle: 'medium'
}).format(new Date(isoDate));
