# Carte Interactive — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un toggle Liste/Carte sur la page d'accueil — la vue Carte affiche jusqu'à 100 événements filtrés comme pins sur une carte Leaflet, avec popup au clic.

**Architecture:** Nouvelle route backend `/api/events/map` (limit 100, champ `lat_lon`). Nouveau composant `MapView.jsx` avec react-leaflet. `Home.jsx` gère un état `view` ('list'|'map') et rend soit la grille existante soit la carte.

**Tech Stack:** leaflet 1.x, react-leaflet 4.x, Open Data Paris (champ `lat_lon: { lat, lon }`)

---

## Fichiers touchés

| Fichier | Action |
|---|---|
| `backend/routes/events.js` | Modifier — ajouter `lat_lon` aux SELECT_FIELDS + nouvelle route GET `/map` |
| `frontend/package.json` | Modifier — ajouter `leaflet` et `react-leaflet` |
| `frontend/src/main.jsx` | Modifier — importer `leaflet/dist/leaflet.css` |
| `frontend/src/api/events.js` | Modifier — ajouter `fetchMapEvents` |
| `frontend/src/components/MapView.jsx` | Créer — composant carte Leaflet avec pins et popups |
| `frontend/src/pages/Home.jsx` | Modifier — état `view`, toggle, rendu conditionnel |
| `frontend/src/index.css` | Modifier — styles `.view-toggle` et `.map-container` |

---

## Tâche 1 — Backend : route `/api/events/map`

**Fichiers :**
- Modifier : `backend/routes/events.js`

- [ ] **Étape 1 : Ajouter `lat_lon` aux SELECT_FIELDS**

Dans `backend/routes/events.js`, ligne 34, remplacer :
```js
const SELECT_FIELDS = 'id,url,title,lead_text,date_start,date_end,address_name,address_zipcode,qfap_tags,cover_url,price_type';
```
Par :
```js
const SELECT_FIELDS = 'id,url,title,lead_text,date_start,date_end,address_name,address_zipcode,qfap_tags,cover_url,price_type,lat_lon';
```

- [ ] **Étape 2 : Ajouter la route `/map` après la route `/:id`**

À la fin de `backend/routes/events.js`, avant `module.exports`, ajouter :
```js
router.get('/map', async (req, res) => {
  const category = ALLOWED_CATEGORIES.includes(req.query.category) ? req.query.category : null;
  const q = sanitizeQ(req.query.q);

  const today = new Date().toISOString().split('T')[0];
  const dateCondition = getDateCondition(req.query.dateFilter) ?? `date_end >= "${today}"`;
  const conditions = [dateCondition];
  if (category) conditions.push(`qfap_tags like "%${category}%"`);
  if (q) conditions.push(`search(title, "${q}")`);

  const params = new URLSearchParams({
    select: SELECT_FIELDS,
    where: conditions.join(' AND '),
    order_by: 'date_start asc',
    limit: 100,
    offset: 0,
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
```

**Important :** cette route doit être déclarée **avant** la route `router.get('/:id', ...)`, sinon Express interprète `/map` comme un `:id`. Vérifier l'ordre dans le fichier.

- [ ] **Étape 3 : Vérifier manuellement la route**

```bash
cd backend && npm run dev
# Dans un autre terminal :
curl "http://localhost:3001/api/events/map?category=Concert" | python3 -m json.tool | head -40
```

Résultat attendu : un objet `{ results: [...] }` avec des événements ayant `lat_lon: { lat: 48.xxx, lon: 2.xxx }`.

- [ ] **Étape 4 : Commit**

```bash
git add backend/routes/events.js
git commit -m "feat(backend): route GET /api/events/map avec champ lat_lon"
```

---

## Tâche 2 — Frontend : installer Leaflet et importer le CSS

**Fichiers :**
- Modifier : `frontend/package.json` (via npm)
- Modifier : `frontend/src/main.jsx`

- [ ] **Étape 1 : Installer les dépendances**

```bash
cd frontend && npm install leaflet react-leaflet
```

Versions attendues : `leaflet@^1.9`, `react-leaflet@^4.2`.

- [ ] **Étape 2 : Importer le CSS Leaflet dans `main.jsx`**

Dans `frontend/src/main.jsx`, ajouter l'import **avant** `import './index.css'` :

```jsx
import 'leaflet/dist/leaflet.css';
import './index.css';
```

L'ordre est important : le CSS Leaflet doit être chargé avant le CSS de l'app pour que les z-index des popups soient corrects.

- [ ] **Étape 3 : Vérifier qu'aucune erreur de compilation n'apparaît**

```bash
cd frontend && npm run dev
```

Ouvrir `http://localhost:3000`. La page d'accueil doit s'afficher normalement, aucune erreur dans la console.

- [ ] **Étape 4 : Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/main.jsx
git commit -m "feat(frontend): installer leaflet + react-leaflet, importer CSS"
```

---

## Tâche 3 — Frontend : `fetchMapEvents` dans l'API

**Fichiers :**
- Modifier : `frontend/src/api/events.js`

- [ ] **Étape 1 : Ajouter la fonction `fetchMapEvents`**

À la fin de `frontend/src/api/events.js`, ajouter :

```js
export async function fetchMapEvents({ q = '', category = 'all', dateFilter = '' } = {}) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (category && category !== 'all') params.set('category', category);
  if (dateFilter) params.set('dateFilter', dateFilter);

  const res = await fetch(`${BASE}/map?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erreur serveur');
  }
  return res.json();
}
```

- [ ] **Étape 2 : Vérifier manuellement dans la console du navigateur**

Avec les deux serveurs (`backend` et `frontend`) en marche, ouvrir la console du navigateur sur `http://localhost:3000` et exécuter :

```js
fetch('/api/events/map?category=Concert').then(r => r.json()).then(console.log)
```

Résultat attendu : `{ results: [ { title: '...', lat_lon: { lat: 48.xxx, lon: 2.xxx }, ... }, ... ] }`

- [ ] **Étape 3 : Commit**

```bash
git add frontend/src/api/events.js
git commit -m "feat(frontend): ajouter fetchMapEvents dans api/events.js"
```

---

## Tâche 4 — Frontend : créer `MapView.jsx`

**Fichiers :**
- Créer : `frontend/src/components/MapView.jsx`

- [ ] **Étape 1 : Créer le composant**

Créer `frontend/src/components/MapView.jsx` avec ce contenu :

```jsx
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { fetchMapEvents } from '../api/events';

// Fix du bug Leaflet + Vite : les icônes de markers sont cassées sans ça
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const PARIS_CENTER = [48.8566, 2.3522];

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
};

export default function MapView({ q, category, dateFilter }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchMapEvents({ q, category, dateFilter })
      .then(data => { setEvents(data.results ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [q, category, dateFilter]);

  return (
    <div className="map-wrapper">
      {loading && <p className="map-loading">Chargement de la carte…</p>}
      <MapContainer
        center={PARIS_CENTER}
        zoom={12}
        className="map-container"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {events.map(event => (
          <Marker
            key={event.id}
            position={[event.lat_lon.lat, event.lat_lon.lon]}
          >
            <Popup className="event-popup">
              {event.cover_url && (
                <img
                  src={event.cover_url}
                  alt={event.title}
                  className="event-popup__img"
                />
              )}
              <div className="event-popup__body">
                {event.qfap_tags && (
                  <span className="event-popup__tag">
                    {event.qfap_tags.split(';')[0].trim()}
                  </span>
                )}
                <strong className="event-popup__title">{event.title}</strong>
                {event.date_start && (
                  <span className="event-popup__date">📅 {formatDate(event.date_start)}</span>
                )}
                {event.address_name && (
                  <span className="event-popup__address">📍 {event.address_name}</span>
                )}
                <Link
                  to={`/events/${event.id}`}
                  state={{ event }}
                  className="event-popup__link"
                >
                  Voir le détail →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
```

- [ ] **Étape 2 : Vérifier la compilation**

```bash
cd frontend && npm run dev
```

Aucune erreur dans le terminal. Si erreur `Cannot find module 'leaflet/dist/images/marker-icon.png'`, vérifier que leaflet est bien installé (`ls frontend/node_modules/leaflet/dist/images/`).

- [ ] **Étape 3 : Commit**

```bash
git add frontend/src/components/MapView.jsx
git commit -m "feat(frontend): composant MapView avec pins Leaflet et popups"
```

---

## Tâche 5 — Frontend : toggle dans `Home.jsx`

**Fichiers :**
- Modifier : `frontend/src/pages/Home.jsx`

- [ ] **Étape 1 : Ajouter l'import de `MapView` et l'état `view`**

En haut de `frontend/src/pages/Home.jsx`, ajouter l'import :
```jsx
import MapView from '../components/MapView';
```

Dans le corps du composant `Home`, ajouter l'état `view` après les autres états :
```js
const [view, setView] = useState('list');
```

- [ ] **Étape 2 : Ajouter le toggle dans les contrôles**

Dans le JSX, dans `.controls__row`, ajouter le toggle **après** le `<p className="results-count">` :

```jsx
<div className="view-toggle" role="group" aria-label="Mode d'affichage">
  <button
    className={`view-toggle__btn${view === 'list' ? ' view-toggle__btn--active' : ''}`}
    aria-pressed={view === 'list'}
    onClick={() => setView('list')}
  >
    ☰ Liste
  </button>
  <button
    className={`view-toggle__btn${view === 'map' ? ' view-toggle__btn--active' : ''}`}
    aria-pressed={view === 'map'}
    onClick={() => setView('map')}
  >
    🗺 Carte
  </button>
</div>
```

- [ ] **Étape 3 : Remplacer le rendu conditionnel de la grille**

Trouver le bloc `{!loading && !error && data?.results?.length > 0 && ( ... )}` dans `Home.jsx`.

Remplacer ce bloc par :

```jsx
{view === 'map' && (
  <MapView q={q} category={category} dateFilter={dateFilter} />
)}

{view === 'list' && !loading && !error && data?.results?.length > 0 && (
  <>
    <div className="events-grid">
      {featured && <EventCard key={featured.id} event={featured} featured style={{ animationDelay: '0ms' }} />}
      {rest.map((event, i) => (
        <EventCard key={event.id} event={event} style={{ animationDelay: `${(i + 1) * 50}ms` }} />
      ))}
    </div>
    <div className="pagination">
      <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Précédent</button>
      <span>{page} / {totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Suivant →</button>
    </div>
  </>
)}
```

Le `{loading && <Loader />}` et `{error && ...}` et le message "Aucun événement trouvé" restent **inchangés** au-dessus.

- [ ] **Étape 4 : Commit**

```bash
git add frontend/src/pages/Home.jsx
git commit -m "feat(frontend): toggle liste/carte dans Home, rendu conditionnel MapView"
```

---

## Tâche 6 — Frontend : styles CSS

**Fichiers :**
- Modifier : `frontend/src/index.css`

- [ ] **Étape 1 : Ajouter les styles du toggle et de la carte**

À la fin de `frontend/src/index.css`, ajouter :

```css
/* ── Vue toggle ──────────────────────────────────────── */
.view-toggle {
  display: flex;
  border: 1.5px solid var(--color-ink);
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}

.view-toggle__btn {
  padding: 6px 14px;
  font-size: 0.8rem;
  font-weight: 600;
  border: none;
  background: transparent;
  color: var(--color-ink);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.view-toggle__btn--active {
  background: var(--color-ink);
  color: #fff;
}

/* ── Carte Leaflet ───────────────────────────────────── */
.map-wrapper {
  position: relative;
  margin-top: 1.5rem;
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow);
}

.map-container {
  height: calc(100vh - 280px);
  min-height: 500px;
  width: 100%;
}

.map-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(245, 243, 239, 0.7);
  z-index: 1000;
  font-style: italic;
  color: var(--color-muted);
}

/* ── Popup événement ─────────────────────────────────── */
.event-popup .leaflet-popup-content {
  margin: 0;
  width: 220px !important;
}

.event-popup .leaflet-popup-content-wrapper {
  padding: 0;
  border-radius: 10px;
  overflow: hidden;
}

.event-popup__img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  display: block;
}

.event-popup__body {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.event-popup__tag {
  font-size: 0.65rem;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: 0.05em;
}

.event-popup__title {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-ink);
  line-height: 1.3;
}

.event-popup__date,
.event-popup__address {
  font-size: 0.75rem;
  color: var(--color-muted);
}

.event-popup__link {
  display: block;
  margin-top: 8px;
  padding: 7px;
  background: var(--color-ink);
  color: #fff;
  text-align: center;
  border-radius: 5px;
  font-size: 0.78rem;
  font-weight: 600;
  text-decoration: none;
}

.event-popup__link:hover {
  opacity: 0.85;
}

@media (max-width: 600px) {
  .map-container {
    height: 60vh;
    min-height: 380px;
  }
}
```

- [ ] **Étape 2 : Commit**

```bash
git add frontend/src/index.css
git commit -m "style(frontend): styles toggle liste/carte et popups Leaflet"
```

---

## Tâche 7 — Test manuel complet

- [ ] **Étape 1 : Démarrer les deux serveurs**

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

- [ ] **Étape 2 : Tester le toggle**

Sur `http://localhost:3000` :
- Le toggle **☰ Liste / 🗺 Carte** apparaît à droite du compteur de résultats
- Cliquer "🗺 Carte" → la grille disparaît, une carte de Paris s'affiche avec des pins
- Cliquer "☰ Liste" → la grille réapparaît, la pagination est présente

- [ ] **Étape 3 : Tester les filtres sur la carte**

Rester en vue Carte :
- Sélectionner "Concerts" dans le filtre catégorie → les pins se rechargent (moins nombreux)
- Taper "jazz" dans la recherche → les pins se filtrent
- Sélectionner "Ce weekend" → les pins se mettent à jour

- [ ] **Étape 4 : Tester la popup**

- Cliquer sur un pin → une popup apparaît avec image, tag, titre, date, adresse, bouton "Voir le détail →"
- Cliquer "Voir le détail →" → navigation vers la page détail de l'événement
- Bouton "← Retour" ramène à la page d'accueil

- [ ] **Étape 5 : Tester sur mobile (DevTools)**

- Ouvrir les DevTools → mode mobile (iPhone SE)
- La carte doit avoir une hauteur `60vh` et être scrollable

- [ ] **Étape 6 : Commit final**

```bash
git push origin develop
```
