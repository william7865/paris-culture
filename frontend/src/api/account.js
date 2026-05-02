const BASE = '/api/account';

const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

const handle = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erreur serveur');
  return data;
};

export const getMe = (token) =>
  fetch(`${BASE}/me`, { headers: authHeaders(token) }).then(handle);

export const updateEmail = (token, email, password) =>
  fetch(`${BASE}/email`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ email, password }),
  }).then(handle);

export const updatePassword = (token, currentPassword, newPassword) =>
  fetch(`${BASE}/password`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ currentPassword, newPassword }),
  }).then(handle);

export const deleteAccount = (token, password) =>
  fetch(BASE, {
    method: 'DELETE',
    headers: authHeaders(token),
    body: JSON.stringify({ password }),
  }).then(handle);
