const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

async function request(path, method = 'GET', body) {
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('Cannot reach the server. Make sure the backend is running.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

export const api = {
  get: (p) => request(p),
  post: (p, b) => request(p, 'POST', b ?? {}),
  put: (p, b) => request(p, 'PUT', b ?? {}),
  del: (p) => request(p, 'DELETE'),
};
