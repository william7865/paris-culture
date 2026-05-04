# Filtres avancés — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un panneau collapsible "Filtres" dans Home.jsx exposant deux nouveaux critères : arrondissement (1er–20ème) et "Gratuit seulement".

**Architecture:** Le backend reçoit deux nouveaux query params (`arrondissement` et `free`) et les injecte dans la clause WHERE ODSQL. Le frontend ajoute un composant `AdvancedFilters` contrôlé, deux états dans `Home.jsx`, et met à jour `useEvents` + `fetchEvents` pour transmettre ces params.

**Tech Stack:** React 18, Express, ODSQL (Open Data Paris)

---

## Fichiers touchés

| Fichier | Action |
|---|---|
| `backend/routes/events.js` | Modifier — ajouter `arrondissement` et `free` dans GET `/` et GET `/map` |
| `frontend/src/api/events.js` | Modifier — transmettre `arrondissement` et `freeOnly` dans `fetchEvents` et `fetchMapEvents` |
| `frontend/src/hooks/useEvents.js` | Modifier — accepter `arrondissement` et `freeOnly` comme paramètres |
| `frontend/src/components/AdvancedFilters.jsx` | Créer — select arrondissement + checkbox gratuit |
| `frontend/src/pages/Home.jsx` | Modifier — 3 nouveaux états, bouton toggle, `<AdvancedFilters />` |
| `frontend/src/index.css` | Modifier — styles panneau avancé + bouton toggle |

---

## Tâche 1 — Backend : params `arrondissement` et `free`

**Fichiers :**
- Modifier : `backend/routes/events.js`

- [ ] **Étape 1 : Ajouter la validation arrondissement dans GET `/`**

Dans `backend/routes/events.js`, après la ligne `const q = sanitizeQ(req.query.q);` (route GET `/`), ajouter :

```js
const arr = parseInt(req.query.arrondissement, 10);
const arrondissementCondition = (!isNaN(arr) && arr >= 1 && arr <= 20)
  ? `address_zipcode = "750${String(arr).padStart(2, '0')}"`
  : null;
const freeCondition = req.query.free === '1' ? `price_type = "gratuit"` : null;
```

Puis ajouter ces conditions au tableau `conditions` après le push de `q` :

```js
if (arrondissementCondition) conditions.push(arrondissementCondition);
if (freeCondition) conditions.push(freeCondition);
```

Le bloc conditions de GET `/` doit ressembler à :
```js
const conditions = [dateCondition];
if (category) conditions.push(`qfap_tags like "%${category}%"`);
if (q) conditions.push(`search(title, "${q}")`);
if (arrondissementCondition) conditions.push(arrondissementCondition);
if (freeCondition) conditions.push(freeCondition);
```

- [ ] **Étape 2 : Faire de même dans GET `/map`**

Dans la route GET `/map`, après `const q = sanitizeQ(req.query.q);`, ajouter les mêmes 3 lignes de validation :

```js
const arr = parseInt(req.query.arrondissement, 10);
const arrondissementCondition = (!isNaN(arr) && arr >= 1 && arr <= 20)
  ? `address_zipcode = "750${String(arr).padStart(2, '0')}"`
  : null;
const freeCondition = req.query.free === '1' ? `price_type = "gratuit"` : null;
```

Et étendre le tableau `conditions` de `/map` :
```js
const conditions = [dateCondition];
if (category) conditions.push(`qfap_tags like "%${category}%"`);
if (q) conditions.push(`search(title, "${q}")`);
if (arrondissementCondition) conditions.push(arrondissementCondition);
if (freeCondition) conditions.push(freeCondition);
```

- [ ] **Étape 3 : Tester manuellement**

Backend lancé (`cd backend && npm run dev`).

```bash
# Filtre arrondissement 1er (zipcode 75001)
curl "http://localhost:3001/api/events?page=1&arrondissement=1" | jq '.results[0].address_zipcode'
# Attendu : "75001"

# Filtre gratuit
curl "http://localhost:3001/api/events?page=1&free=1" | jq '.results[0].price_type'
# Attendu : "gratuit"

# Valeur invalide ignorée silencieusement
curl "http://localhost:3001/api/events?page=1&arrondissement=99" | jq '.total_count'
# Attendu : nombre normal (pas de filtre appliqué)
```

- [ ] **Étape 4 : Commit**

```bash
git add backend/routes/events.js
git commit -m "feat(backend): filtres arrondissement et gratuit dans GET / et /map"
```

---

## Tâche 2 — Frontend API : transmettre les nouveaux params

**Fichiers :**
- Modifier : `frontend/src/api/events.js`

- [ ] **Étape 1 : Mettre à jour `fetchEvents`**

Remplacer la signature et le corps de `fetchEvents` :

```js
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
```

- [ ] **Étape 2 : Mettre à jour `fetchMapEvents`**

Remplacer `fetchMapEvents` :

```js
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
```

- [ ] **Étape 3 : Commit**

```bash
git add frontend/src/api/events.js
git commit -m "feat(frontend): fetchEvents + fetchMapEvents acceptent arrondissement et freeOnly"
```

---

## Tâche 3 — Hook `useEvents` : accepter les nouveaux params

**Fichiers :**
- Modifier : `frontend/src/hooks/useEvents.js`

- [ ] **Étape 1 : Étendre la signature du hook**

Remplacer tout le contenu du fichier :

```js
import { useState, useEffect } from 'react';
import { fetchEvents } from '../api/events';

export default function useEvents(q, category, page, sort = 'date_asc', dateFilter = '', arrondissement = 'all', freeOnly = false) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchEvents({ q, category, page, sort, dateFilter, arrondissement, freeOnly }, controller.signal)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err.message);
        setLoading(false);
      });

    return () => controller.abort();
  }, [q, category, page, sort, dateFilter, arrondissement, freeOnly]);

  return { data, loading, error };
}
```

- [ ] **Étape 2 : Vérifier la compilation**

```bash
cd /path/to/frontend && npm run build 2>&1 | tail -3
```

Attendu : `✓ built in X.XXs` sans erreur.

- [ ] **Étape 3 : Commit**

```bash
git add frontend/src/hooks/useEvents.js
git commit -m "feat(frontend): useEvents accepte arrondissement et freeOnly"
```

---

## Tâche 4 — Composant `AdvancedFilters` + CSS

**Fichiers :**
- Créer : `frontend/src/components/AdvancedFilters.jsx`
- Modifier : `frontend/src/index.css`

- [ ] **Étape 1 : Créer `AdvancedFilters.jsx`**

```jsx
const ARRONDISSEMENTS = Array.from({ length: 20 }, (_, i) => i + 1);
const ordinal = (n) => n === 1 ? '1er' : `${n}ème`;

export default function AdvancedFilters({ arrondissement, freeOnly, onArrondissementChange, onFreeOnlyChange }) {
  return (
    <div className="advanced-filters">
      <div className="advanced-filters__field">
        <label htmlFor="arr-select" className="advanced-filters__label">Arrondissement</label>
        <select
          id="arr-select"
          className="advanced-filters__select"
          value={arrondissement}
          onChange={e => onArrondissementChange(e.target.value)}
        >
          <option value="all">Tous les arrondissements</option>
          {ARRONDISSEMENTS.map(n => (
            <option key={n} value={String(n)}>{ordinal(n)} arrondissement</option>
          ))}
        </select>
      </div>

      <label className="advanced-filters__checkbox-label">
        <input
          type="checkbox"
          checked={freeOnly}
          onChange={e => onFreeOnlyChange(e.target.checked)}
        />
        Gratuit seulement
      </label>
    </div>
  );
}
```

- [ ] **Étape 2 : Ajouter les styles dans `index.css`**

À la fin de `frontend/src/index.css` (avant le bloc `[data-theme="light"]`), ajouter :

```css
/* ── Filtres avancés ─────────────────────────────────── */
.advanced-filters-toggle {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--muted);
  border-radius: 20px;
  padding: 3px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  white-space: nowrap;
}

.advanced-filters-toggle:hover,
.advanced-filters-toggle--active {
  color: var(--gold);
  border-color: var(--gold);
}

.advanced-filters {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: .75rem 0 .25rem;
  flex-wrap: wrap;
}

.advanced-filters__field {
  display: flex;
  align-items: center;
  gap: .5rem;
}

.advanced-filters__label {
  font-size: .75rem;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .1em;
  white-space: nowrap;
}

.advanced-filters__select {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 8px;
  padding: 4px 8px;
  font-size: 13px;
  cursor: pointer;
}

.advanced-filters__checkbox-label {
  display: flex;
  align-items: center;
  gap: .4rem;
  font-size: 13px;
  color: var(--text);
  cursor: pointer;
  user-select: none;
}

.advanced-filters__checkbox-label input[type="checkbox"] {
  accent-color: var(--gold);
  width: 15px;
  height: 15px;
  cursor: pointer;
}
```

- [ ] **Étape 3 : Commit**

```bash
git add frontend/src/components/AdvancedFilters.jsx frontend/src/index.css
git commit -m "feat(frontend): composant AdvancedFilters + styles CSS"
```

---

## Tâche 5 — Câbler `Home.jsx`

**Fichiers :**
- Modifier : `frontend/src/pages/Home.jsx`

- [ ] **Étape 1 : Ajouter l'import**

En haut du fichier, après l'import de `QuickDateFilter` :

```jsx
import AdvancedFilters from '../components/AdvancedFilters';
```

- [ ] **Étape 2 : Ajouter les 3 nouveaux états**

Dans le corps du composant `Home`, après `const [view, setView] = useState('list');` :

```jsx
const [arrondissement, setArrondissement]   = useState('all');
const [freeOnly, setFreeOnly]               = useState(false);
const [showAdvanced, setShowAdvanced]       = useState(false);
```

- [ ] **Étape 3 : Mettre à jour l'appel à `useEvents`**

Remplacer :
```jsx
const { data, loading, error } = useEvents(q, category, page, sort, dateFilter);
```

Par :
```jsx
const { data, loading, error } = useEvents(q, category, page, sort, dateFilter, arrondissement, freeOnly);
```

- [ ] **Étape 4 : Ajouter les handlers**

Après `const handleView = useCallback((v) => setView(v), []);`, ajouter :

```jsx
const handleArrondissement = useCallback((v) => { setArrondissement(v); setPage(1); }, []);
const handleFreeOnly       = useCallback((v) => { setFreeOnly(v);       setPage(1); }, []);
```

- [ ] **Étape 5 : Ajouter le badge et bouton dans le JSX**

Remplacer la `div.view-toggle` existante par :

```jsx
<div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
  {(() => {
    const advancedCount = (arrondissement !== 'all' ? 1 : 0) + (freeOnly ? 1 : 0);
    return (
      <button
        className={`advanced-filters-toggle${showAdvanced ? ' advanced-filters-toggle--active' : ''}`}
        onClick={() => setShowAdvanced(v => !v)}
        aria-expanded={showAdvanced}
      >
        Filtres{advancedCount > 0 ? ` (${advancedCount})` : ''}
      </button>
    );
  })()}
  <div className="view-toggle" role="group" aria-label="Mode d'affichage">
    <button
      className={`view-toggle__btn${view === 'list' ? ' view-toggle__btn--active' : ''}`}
      aria-pressed={view === 'list'}
      onClick={() => handleView('list')}
    >
      ☰ Liste
    </button>
    <button
      className={`view-toggle__btn${view === 'map' ? ' view-toggle__btn--active' : ''}`}
      aria-pressed={view === 'map'}
      onClick={() => handleView('map')}
    >
      🗺 Carte
    </button>
  </div>
</div>
```

- [ ] **Étape 6 : Insérer `<AdvancedFilters />` sous `<QuickDateFilter />`**

Après la ligne `<QuickDateFilter active={dateFilter} onChange={handleDateFilter} />`, ajouter :

```jsx
{showAdvanced && (
  <AdvancedFilters
    arrondissement={arrondissement}
    freeOnly={freeOnly}
    onArrondissementChange={handleArrondissement}
    onFreeOnlyChange={handleFreeOnly}
  />
)}
```

- [ ] **Étape 7 : Passer les nouveaux filtres à `MapView`**

Remplacer :
```jsx
<MapView q={q} category={category} dateFilter={dateFilter} />
```

Par :
```jsx
<MapView q={q} category={category} dateFilter={dateFilter} arrondissement={arrondissement} freeOnly={freeOnly} />
```

- [ ] **Étape 8 : Vérifier la compilation**

```bash
cd frontend && npm run build 2>&1 | tail -3
```

Attendu : `✓ built in X.XXs` sans erreur.

- [ ] **Étape 9 : Commit**

```bash
git add frontend/src/pages/Home.jsx
git commit -m "feat(frontend): filtres avancés câblés dans Home — arrondissement, freeOnly, toggle"
```

---

## Tâche 6 — Mettre à jour `MapView` pour accepter les nouveaux props

**Fichiers :**
- Modifier : `frontend/src/components/MapView.jsx`

- [ ] **Étape 1 : Lire `MapView.jsx` et vérifier la signature**

Lire `frontend/src/components/MapView.jsx`. La fonction reçoit actuellement `{ q, category, dateFilter }`.

- [ ] **Étape 2 : Étendre la signature et l'appel API**

Remplacer la ligne de destructuration des props :
```jsx
export default function MapView({ q, category, dateFilter }) {
```
Par :
```jsx
export default function MapView({ q, category, dateFilter, arrondissement = 'all', freeOnly = false }) {
```

Mettre à jour l'appel à `fetchMapEvents` dans le `useEffect` :
```jsx
fetchMapEvents({ q, category, dateFilter, arrondissement, freeOnly })
```

Ajouter `arrondissement` et `freeOnly` au tableau de dépendances du `useEffect` :
```jsx
}, [q, category, dateFilter, arrondissement, freeOnly, retryCount]);
```

- [ ] **Étape 3 : Vérifier la compilation**

```bash
cd frontend && npm run build 2>&1 | tail -3
```

Attendu : `✓ built in X.XXs` sans erreur.

- [ ] **Étape 4 : Commit**

```bash
git add frontend/src/components/MapView.jsx
git commit -m "feat(frontend): MapView accepte arrondissement et freeOnly"
```

---

## Tâche 7 — Test manuel

- [ ] **Étape 1 : Lancer le dev server**

```bash
cd frontend && npm run dev
```

Ouvrir `http://localhost:3000`.

- [ ] **Étape 2 : Tester le bouton Filtres**

- Le bouton **"Filtres"** apparaît à gauche du toggle liste/carte
- Cliquer → le panneau s'ouvre avec le select arrondissement et la checkbox
- Cliquer à nouveau → le panneau se ferme

- [ ] **Étape 3 : Tester le filtre arrondissement**

- Sélectionner "4ème arrondissement"
- La liste se met à jour et affiche des événements avec `address_zipcode === "75004"`
- Le bouton affiche "Filtres (1)"

- [ ] **Étape 4 : Tester "Gratuit seulement"**

- Cocher "Gratuit seulement"
- Tous les événements affichés ont un badge "Gratuit"
- Le bouton affiche "Filtres (2)" si arrondissement est aussi sélectionné

- [ ] **Étape 5 : Tester en vue Carte**

- Passer en vue Carte avec un filtre arrondissement actif
- Les marqueurs doivent se limiter à l'arrondissement sélectionné

- [ ] **Étape 6 : Push**

```bash
git push origin develop
```
