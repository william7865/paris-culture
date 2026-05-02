const BASE = '/api/auth';

const request = async (path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erreur serveur');
  return data;
};

export const register = (email, password) => request('/register', { email, password });
export const login    = (email, password) => request('/login',    { email, password });
