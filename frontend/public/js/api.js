const API_BASE = '/api';

const roleLabel = (role) => {
  if (role === 'supervisor') return 'Analista de Control y Asistencia';
  if (role === 'qr_operator') return 'Generador QR';
  if (role === 'admin') return 'Administrador';
  if (role === 'empleado') return 'Usuario';
  return role;
};

const showToast = (message, kind = 'success') => {
  let host = document.getElementById('toast-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toast-host';
    document.body.appendChild(host);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${kind}`;
  toast.textContent = message;
  host.appendChild(toast);

  window.setTimeout(() => {
    toast.classList.add('out');
    window.setTimeout(() => toast.remove(), 240);
  }, 2600);
};

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
