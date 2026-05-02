const BASE = '/api/events';

export async function fetchEvents({ q = '', category = 'all', page = 1, sort = 'date_asc' } = {}, signal) {
  const params = new URLSearchParams({ page, sort });
  if (q) params.set('q', q);
  if (category && category !== 'all') params.set('category', category);

  const res = await fetch(`${BASE}?${params}`, { signal });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erreur serveur');
  }
  return res.json();
}

export async function fetchEvent(id) {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Événement introuvable');
  }
  return res.json();
}
