const BASE = '/api/events';

export async function fetchEvents({ q = '', category = 'all', page = 1, sort = 'date_asc', dateFilter = '', arrondissement = 'all', freeOnly = false } = {}, signal) {
  const params = new URLSearchParams({ page, sort });
  if (q) params.set('q', q);
  if (category && category !== 'all') params.set('category', category);
  if (dateFilter) params.set('dateFilter', dateFilter);
  if (arrondissement && arrondissement !== 'all') params.set('arrondissement', arrondissement);
  if (freeOnly) params.set('free', '1');

  const res = await fetch(`${BASE}?${params}`, { signal });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erreur serveur');
  }
  return res.json();
}

export async function fetchSimilarEvents(tag, excludeId) {
  const params = new URLSearchParams({
    page: 1,
    sort: 'date_asc',
    category: tag,
  });
  const res = await fetch(`${BASE}?${params}`);
  if (!res.ok) return [];
  const data = await res.json().catch(() => ({ results: [] }));
  return (data.results ?? []).filter(e => e.id !== excludeId).slice(0, 3);
}

export async function fetchEvent(id) {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Événement introuvable');
  }
  return res.json();
}

export async function fetchMapEvents({ q = '', category = 'all', dateFilter = '', arrondissement = 'all', freeOnly = false } = {}) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (category && category !== 'all') params.set('category', category);
  if (dateFilter) params.set('dateFilter', dateFilter);
  if (arrondissement && arrondissement !== 'all') params.set('arrondissement', arrondissement);
  if (freeOnly) params.set('free', '1');

  const res = await fetch(`${BASE}/map?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erreur serveur');
  }
  return res.json();
}

export async function fetchCalendarEvents({ q = '', category = 'all', arrondissement = 'all', freeOnly = false, dateFrom, dateTo } = {}) {
  const params = new URLSearchParams({ page: 1, sort: 'date_asc' });
  if (q) params.set('q', q);
  if (category && category !== 'all') params.set('category', category);
  if (arrondissement && arrondissement !== 'all') params.set('arrondissement', arrondissement);
  if (freeOnly) params.set('free', '1');
  if (dateFrom) params.set('dateFrom', dateFrom);
  if (dateTo)   params.set('dateTo', dateTo);

  const res = await fetch(`${BASE}?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erreur serveur');
  }
  return res.json();
}
