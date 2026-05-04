const express = require('express');
const cache = require('../middleware/cache');

const router = express.Router();

const API_BASE = 'https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/que-faire-a-paris-/records';
const LIMIT = 12;
const MAP_LIMIT = 100;
const CACHE_TTL = parseInt(process.env.CACHE_TTL_MS) || 300_000;

const ALLOWED_CATEGORIES = ['Concert', 'Expo', 'Festival', 'Ecrans', 'Sport', 'Théâtre', 'Enfants'];

const ALLOWED_SORT = {
  'date_asc':   'date_start asc',
  'date_desc':  'date_start desc',
  'free_first': 'price_type asc',
};

const getDateCondition = (filter) => {
  const d = (offset = 0) => {
    const dt = new Date();
    dt.setDate(dt.getDate() + offset);
    return dt.toISOString().split('T')[0];
  };
  if (filter === 'today') return `date_start <= "${d()}" AND date_end >= "${d()}"`;
  if (filter === 'week')  return `date_end >= "${d()}" AND date_start <= "${d(7)}"`;
  if (filter === 'weekend') {
    const now = new Date();
    const toSat = (6 - now.getDay() + 7) % 7 || 7;
    return `date_start >= "${d(toSat)}" AND date_start <= "${d(toSat + 1)}"`;
  }
  return null;
};

const SELECT_FIELDS = 'id,url,title,lead_text,date_start,date_end,address_name,address_zipcode,qfap_tags,cover_url,price_type,lat_lon';

const sanitizeQ = (q) => {
  if (!q || typeof q !== 'string') return '';
  return q.trim().slice(0, 100).replace(/"/g, '');
};

router.get('/', async (req, res) => {
  const page = parseInt(req.query.page);
  if (isNaN(page) || page < 1) {
    return res.status(400).json({ error: 'Le paramètre page doit être un entier positif.' });
  }

  const category = ALLOWED_CATEGORIES.includes(req.query.category) ? req.query.category : null;
  const q = sanitizeQ(req.query.q);
  const arr = parseInt(req.query.arrondissement, 10);
  const arrondissementCondition = (!isNaN(arr) && arr >= 1 && arr <= 20)
    ? `address_zipcode = "750${String(arr).padStart(2, '0')}"`
    : null;
  const freeCondition = req.query.free === '1' ? `price_type = "gratuit"` : null;
  const sort = ALLOWED_SORT[req.query.sort] ?? ALLOWED_SORT['date_asc'];
  const offset = (page - 1) * LIMIT;

  const today = new Date().toISOString().split('T')[0];
  const dateCondition = getDateCondition(req.query.dateFilter) ?? `date_end >= "${today}"`;
  const conditions = [dateCondition];
  if (category) conditions.push(`qfap_tags like "%${category}%"`);
  if (q) conditions.push(`search(title, "${q}")`);
  if (arrondissementCondition) conditions.push(arrondissementCondition);
  if (freeCondition) conditions.push(freeCondition);

  const params = new URLSearchParams({
    select: SELECT_FIELDS,
    where: conditions.join(' AND '),
    order_by: sort,
    limit: LIMIT,
    offset,
  });

  const cacheKey = `events:${params.toString()}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const response = await fetch(`${API_BASE}?${params}`);
    if (!response.ok) throw new Error(`Open Data API error: ${response.status}`);

    const data = await response.json();
    const result = {
      results: data.results,
      total_count: data.total_count,
      page,
      limit: LIMIT,
    };

    cache.set(cacheKey, result, CACHE_TTL);
    res.json(result);
  } catch (err) {
    console.error(`[events] ${err.message}`);
    res.status(500).json({ error: 'Impossible de récupérer les événements.' });
  }
});

router.get('/map', async (req, res) => {
  const category = ALLOWED_CATEGORIES.includes(req.query.category) ? req.query.category : null;
  const q = sanitizeQ(req.query.q);
  const arr = parseInt(req.query.arrondissement, 10);
  const arrondissementCondition = (!isNaN(arr) && arr >= 1 && arr <= 20)
    ? `address_zipcode = "750${String(arr).padStart(2, '0')}"`
    : null;
  const freeCondition = req.query.free === '1' ? `price_type = "gratuit"` : null;

  const today = new Date().toISOString().split('T')[0];
  const dateCondition = getDateCondition(req.query.dateFilter) ?? `date_end >= "${today}"`;
  const conditions = [dateCondition];
  if (category) conditions.push(`qfap_tags like "%${category}%"`);
  if (q) conditions.push(`search(title, "${q}")`);
  if (arrondissementCondition) conditions.push(arrondissementCondition);
  if (freeCondition) conditions.push(freeCondition);

  const params = new URLSearchParams({
    select: SELECT_FIELDS,
    where: conditions.join(' AND '),
    order_by: ALLOWED_SORT['date_asc'],
    limit: MAP_LIMIT,
  });

  const cacheKey = `map:${params.toString()}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const response = await fetch(`${API_BASE}?${params}`);
    if (!response.ok) throw new Error(`Open Data API error: ${response.status}`);

    const data = await response.json();
    const results = (data.results ?? []).filter(
      e => e.lat_lon?.lat && e.lat_lon?.lon
    );

    const result = { results };
    cache.set(cacheKey, result, CACHE_TTL);
    res.json(result);
  } catch (err) {
    console.error(`[events/map] ${err.message}`);
    res.status(500).json({ error: 'Impossible de récupérer les événements pour la carte.' });
  }
});

router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id < 1) {
    return res.status(400).json({ error: 'ID invalide.' });
  }

  const cacheKey = `event:${id}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  const params = new URLSearchParams({
    where: `id = ${id}`,
    limit: 1,
  });

  try {
    const response = await fetch(`${API_BASE}?${params}`);
    if (!response.ok) throw new Error(`Open Data API error: ${response.status}`);

    const data = await response.json();
    if (!data.results || data.results.length === 0) {
      return res.status(404).json({ error: 'Événement introuvable.' });
    }

    const event = data.results[0];
    cache.set(cacheKey, event, CACHE_TTL);
    res.json(event);
  } catch (err) {
    console.error(`[events/:id] ${err.message}`);
    res.status(500).json({ error: "Impossible de récupérer l'événement." });
  }
});

module.exports = router;
