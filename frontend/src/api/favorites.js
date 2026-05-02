const BASE = '/api/favorites';

const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

export const getFavorites = async (token) => {
  const res = await fetch(BASE, { headers: authHeaders(token) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(res.status === 401 ? '401' : (data.error || 'Erreur serveur'));
  return data;
};

export const addFavorite = async (token, event) => {
  const res = await fetch(`${BASE}/${event.id}`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(event),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erreur serveur');
  return data;
};

export const removeFavorite = async (token, eventId) => {
  const res = await fetch(`${BASE}/${eventId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erreur serveur');
  return data;
};
