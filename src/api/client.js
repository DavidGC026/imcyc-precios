const API_BASE = process.env.PUBLIC_URL || '/precios';

async function request(path, options = {}) {
  const url = `${API_BASE}/api${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) {
    const message = body.message || `Error HTTP ${response.status}`;
    throw new Error(message);
  }
  return body;
}

export const apiClient = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, data) => request(path, { method: 'POST', body: JSON.stringify(data) }),
};

export const APP_BASE = API_BASE;
