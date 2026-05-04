# Vue Calendrier — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une 3ème option "Calendrier" dans le toggle de vue (liste/carte/calendrier) affichant les événements sous forme de grille mensuelle avec navigation mois par mois.

**Architecture:** Le backend reçoit deux nouveaux params optionnels `dateFrom`/`dateTo` (YYYY-MM-DD) qui remplacent la condition par défaut `date_end >= today` quand fournis. Un composant `CalendarView` gère son propre état (mois affiché, événements, jour sélectionné), fetche les événements du mois via `fetchCalendarEvents`, les groupe par jour en mémoire, et affiche une grille + liste de détail au clic.

**Tech Stack:** React 18, CSS Grid, Express/ODSQL

---

## Fichiers touchés

| Fichier | Action |
|---|---|
| `backend/routes/events.js` | Modifier — gérer `dateFrom`/`dateTo` dans GET `/` |
| `frontend/src/api/events.js` | Modifier — ajouter `fetchCalendarEvents` + `dateFrom`/`dateTo` dans `fetchEvents` |
| `frontend/src/components/CalendarView.jsx` | Créer — grille mensuelle, navigation, liste du jour |
| `frontend/src/pages/Home.jsx` | Modifier — 3ème option dans le toggle, masquer QuickDateFilter en vue calendrier |
| `frontend/src/index.css` | Modifier — styles calendrier |

---

## Tâche 1 — Backend : params `dateFrom` / `dateTo`

**Fichiers :**
- Modifier : `backend/routes/events.js`

- [ ] **Étape 1 : Remplacer la logique de date dans GET `/`**

Actuellement dans GET `/` :
```js
const today = new Date().toISOString().split('T')[0];
const dateCondition = getDateCondition(req.query.dateFilter) ?? `date_end >= "${today}"`;
```

Remplacer par :
```js
const today = new Date().toISOString().split('T')[0];

const isValidDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const dateFrom = isValidDate(req.query.dateFrom) ? req.query.dateFrom : null;
const dateTo   = isValidDate(req.query.dateTo)   ? req.query.dateTo   : null;

let dateCondition;
if (dateFrom) {
  dateCondition = `date_end >= "${dateFrom}"`;
} else {
  dateCondition = getDateCondition(req.query.dateFilter) ?? `date_end >= "${today}"`;
}
const dateToCondition = dateTo ? `date_start <= "${dateTo}"` : null;
```

Puis dans le tableau `conditions`, remplacer `const conditions = [dateCondition];` par :
```js
const conditions = [dateCondition];
if (dateToCondition) conditions.push(dateToCondition);
```

Le reste du tableau conditions (`category`, `q`, `arrondissementCondition`, `freeCondition`) reste inchangé après ces deux lignes.

- [ ] **Étape 2 : Tester manuellement**

Backend lancé (`cd backend && npm run dev`).

```bash
# Événements du mois de mai 2026
curl "http://localhost:3001/api/events?page=1&dateFrom=2026-05-01&dateTo=2026-05-31" | jq '.total_count'
# Attendu : un nombre > 0

# Comportement par défaut inchangé (sans dateFrom/dateTo)
curl "http://localhost:3001/api/events?page=1" | jq '.total_count'
# Attendu : même résultat qu'avant (événements à partir d'aujourd'hui)
```

- [ ] **Étape 3 : Commit**

```bash
git add backend/routes/events.js
git commit -m "feat(backend): params dateFrom/dateTo pour filtrage par plage de dates"
```

---

## Tâche 2 — Frontend API : `fetchCalendarEvents`

**Fichiers :**
- Modifier : `frontend/src/api/events.js`

- [ ] **Étape 1 : Ajouter `fetchCalendarEvents`**

À la fin de `frontend/src/api/events.js`, ajouter :

```js
export async function fetchCalendarEvents({ q = '', category = 'all', arrondissement = 'all', freeOnly = false, dateFrom, dateTo } = {}) {
  const params = new URLSearchParams({ page: 1, sort: 'date_asc', limit: 200 });
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
```

Note : le backend ignore `limit` dans sa logique (utilise la constante `LIMIT = 12`). Pour récupérer plus d'événements pour le calendrier, l'implémentation devra faire plusieurs pages ou accepter un `limit` custom. En pratique, pour l'affichage calendrier, les 12 premiers événements du mois suffisent pour montrer les dots — on utilisera `page=1` et on acceptera cette limitation.

En réalité le backend utilise `LIMIT = 12` hardcodé. Pas besoin de changer ça — `fetchCalendarEvents` récupère simplement page 1 (12 événements) et les affiche. Le calendrier montrera les événements disponibles.

Mettre à jour la signature de `fetchCalendarEvents` pour retirer le `limit: 200` :

```js
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
```

- [ ] **Étape 2 : Vérifier la compilation**

```bash
cd frontend && npm run build 2>&1 | tail -3
```

Attendu : `✓ built in X.XXs`.

- [ ] **Étape 3 : Commit**

```bash
git add frontend/src/api/events.js
git commit -m "feat(frontend): fetchCalendarEvents avec dateFrom/dateTo"
```

---

## Tâche 3 — Composant `CalendarView`

**Fichiers :**
- Créer : `frontend/src/components/CalendarView.jsx`

- [ ] **Étape 1 : Créer le fichier**

```jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchCalendarEvents } from '../api/events';

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                   'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

function toISO(date) {
  return date.toISOString().split('T')[0];
}

function groupByDay(events) {
  const map = new Map();
  for (const event of events) {
    const start = event.date_start ? event.date_start.split('T')[0] : null;
    const end   = event.date_end   ? event.date_end.split('T')[0]   : start;
    if (!start) continue;
    let cur = new Date(start);
    const endDate = new Date(end);
    while (cur <= endDate) {
      const key = toISO(cur);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(event);
      cur.setDate(cur.getDate() + 1);
    }
  }
  return map;
}

function buildGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  // Monday-first: getDay() returns 0=Sun, adjust to Mon=0
  const startOffset = (firstDay.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < startOffset; i++) {
    const d = new Date(year, month, 1 - (startOffset - i));
    cells.push({ date: toISO(d), currentMonth: false });
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push({ date: toISO(new Date(year, month, d)), currentMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const d = new Date(year, month + 1, cells.length - lastDay.getDate() - startOffset + 1);
    cells.push({ date: toISO(d), currentMonth: false });
  }
  return cells;
}

export default function CalendarView({ q, category, arrondissement = 'all', freeOnly = false }) {
  const now = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSelectedDay(null);

    const dateFrom = toISO(new Date(year, month, 1));
    const dateTo   = toISO(new Date(year, month + 1, 0));

    fetchCalendarEvents({ q, category, arrondissement, freeOnly, dateFrom, dateTo })
      .then(data => {
        if (!cancelled) {
          setEvents(data.results ?? []);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [year, month, q, category, arrondissement, freeOnly]);

  const eventsByDay = groupByDay(events);
  const cells = buildGrid(year, month);
  const todayISO = toISO(new Date());

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const selectedEvents = selectedDay ? (eventsByDay.get(selectedDay) ?? []) : [];

  return (
    <div className="calendar">
      <div className="calendar__header">
        <button className="calendar__nav-btn" onClick={prevMonth} aria-label="Mois précédent">◀</button>
        <h2 className="calendar__title">{MONTHS_FR[month]} {year}</h2>
        <button className="calendar__nav-btn" onClick={nextMonth} aria-label="Mois suivant">▶</button>
      </div>

      {loading && <div className="calendar__loading">Chargement…</div>}
      {error && <div className="state-message state-message--error"><p>{error}</p></div>}

      {!loading && !error && (
        <>
          <div className="calendar__grid">
            {DAYS_FR.map(d => (
              <div key={d} className="calendar__day-header">{d}</div>
            ))}
            {cells.map(cell => {
              const count = eventsByDay.get(cell.date)?.length ?? 0;
              const isSelected = cell.date === selectedDay;
              const isToday = cell.date === todayISO;
              return (
                <div
                  key={cell.date}
                  className={[
                    'calendar__day',
                    !cell.currentMonth ? 'calendar__day--other-month' : '',
                    count > 0 ? 'calendar__day--has-events' : '',
                    isSelected ? 'calendar__day--selected' : '',
                    isToday ? 'calendar__day--today' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => count > 0 && setSelectedDay(isSelected ? null : cell.date)}
                >
                  <span className="calendar__day-num">{parseInt(cell.date.split('-')[2], 10)}</span>
                  {count > 0 && (
                    <span className="calendar__count">{count}</span>
                  )}
                </div>
              );
            })}
          </div>

          {selectedDay && selectedEvents.length > 0 && (
            <div className="calendar__events">
              <h3 className="calendar__events-title">
                {new Date(selectedDay + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <ul className="calendar__events-list">
                {selectedEvents.map(event => (
                  <li key={event.id} className="calendar__event-item">
                    <Link to={`/events/${event.url_name ?? event.id}`} className="calendar__event-link">
                      <span className="calendar__event-title">{event.title}</span>
                      <span className="calendar__event-meta">{event.address_name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Étape 2 : Vérifier la compilation**

```bash
cd frontend && npm run build 2>&1 | tail -3
```

Attendu : `✓ built in X.XXs`.

- [ ] **Étape 3 : Commit**

```bash
git add frontend/src/components/CalendarView.jsx
git commit -m "feat(frontend): composant CalendarView — grille mensuelle, navigation, détail du jour"
```

---

## Tâche 4 — CSS calendrier

**Fichiers :**
- Modifier : `frontend/src/index.css`

- [ ] **Étape 1 : Ajouter les styles à la fin de `index.css` (avant le bloc `[data-theme="light"]`)**

```css
/* ── Calendrier ──────────────────────────────────────── */
.calendar {
  margin-top: 1.5rem;
}

.calendar__header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.calendar__nav-btn {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--muted);
  border-radius: 8px;
  padding: 4px 10px;
  cursor: pointer;
  font-size: 14px;
  transition: color 0.15s, border-color 0.15s;
}

.calendar__nav-btn:hover {
  color: var(--gold);
  border-color: var(--gold);
}

.calendar__title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--cream);
  letter-spacing: .05em;
  min-width: 180px;
  text-align: center;
}

.calendar__loading {
  text-align: center;
  color: var(--muted);
  padding: 2rem;
}

.calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: var(--border);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}

.calendar__day-header {
  background: var(--surface);
  text-align: center;
  padding: .5rem 0;
  font-size: .7rem;
  text-transform: uppercase;
  letter-spacing: .12em;
  color: var(--muted);
}

.calendar__day {
  background: var(--bg);
  min-height: 64px;
  padding: .4rem .5rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: .2rem;
  transition: background 0.15s;
}

.calendar__day--other-month {
  opacity: .3;
}

.calendar__day--has-events {
  cursor: pointer;
}

.calendar__day--has-events:hover {
  background: var(--surface);
}

.calendar__day--today .calendar__day-num {
  background: var(--gold);
  color: #1a1713;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.calendar__day--selected {
  background: var(--surface);
  outline: 2px solid var(--gold);
  outline-offset: -2px;
}

.calendar__day-num {
  font-size: .8rem;
  color: var(--text);
  font-weight: 500;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.calendar__count {
  font-size: .65rem;
  color: var(--gold);
  font-weight: 700;
  background: color-mix(in srgb, var(--gold) 15%, transparent);
  border-radius: 10px;
  padding: 1px 5px;
}

.calendar__events {
  margin-top: 1.5rem;
  padding: 1rem;
  background: var(--surface);
  border-radius: 12px;
  border: 1px solid var(--border);
}

.calendar__events-title {
  font-size: .85rem;
  text-transform: uppercase;
  letter-spacing: .1em;
  color: var(--gold);
  margin-bottom: .75rem;
}

.calendar__events-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: .5rem;
}

.calendar__event-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: .5rem .75rem;
  background: var(--card);
  border-radius: 8px;
  text-decoration: none;
  transition: background 0.15s;
}

.calendar__event-link:hover {
  background: var(--card-hover);
}

.calendar__event-title {
  color: var(--text);
  font-size: .9rem;
  font-weight: 500;
}

.calendar__event-meta {
  color: var(--muted);
  font-size: .75rem;
  white-space: nowrap;
}

@media (max-width: 600px) {
  .calendar__day { min-height: 44px; padding: .3rem; }
  .calendar__event-link { flex-direction: column; align-items: flex-start; gap: .2rem; }
}
```

- [ ] **Étape 2 : Commit**

```bash
git add frontend/src/index.css
git commit -m "style(frontend): styles CSS vue calendrier"
```

---

## Tâche 5 — Câbler `CalendarView` dans `Home.jsx`

**Fichiers :**
- Modifier : `frontend/src/pages/Home.jsx`

- [ ] **Étape 1 : Ajouter l'import**

En haut du fichier, après l'import de `MapView` :

```jsx
import CalendarView from '../components/CalendarView';
```

- [ ] **Étape 2 : Ajouter le bouton "Calendrier" dans le toggle**

Trouver la `div.view-toggle` dans le JSX. La liste des boutons doit être :

```jsx
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
  <button
    className={`view-toggle__btn${view === 'calendar' ? ' view-toggle__btn--active' : ''}`}
    aria-pressed={view === 'calendar'}
    onClick={() => handleView('calendar')}
  >
    📅 Calendrier
  </button>
</div>
```

- [ ] **Étape 3 : Masquer `QuickDateFilter` en vue calendrier**

Remplacer :
```jsx
<QuickDateFilter active={dateFilter} onChange={handleDateFilter} />
```

Par :
```jsx
{view !== 'calendar' && (
  <QuickDateFilter active={dateFilter} onChange={handleDateFilter} />
)}
```

- [ ] **Étape 4 : Ajouter le rendu `CalendarView`**

Après la ligne `{view === 'map' && ( <MapView ... /> )}`, ajouter :

```jsx
{view === 'calendar' && (
  <CalendarView
    q={q}
    category={category}
    arrondissement={arrondissement}
    freeOnly={freeOnly}
  />
)}
```

- [ ] **Étape 5 : Vérifier la compilation**

```bash
cd frontend && npm run build 2>&1 | tail -3
```

Attendu : `✓ built in X.XXs`.

- [ ] **Étape 6 : Commit**

```bash
git add frontend/src/pages/Home.jsx
git commit -m "feat(frontend): vue calendrier câblée dans Home — toggle 3 options"
```

---

## Tâche 6 — Test manuel

- [ ] **Étape 1 : Lancer le dev server**

```bash
cd frontend && npm run dev
```

- [ ] **Étape 2 : Tester la navigation**

- Le toggle affiche désormais 3 boutons : ☰ Liste / 🗺 Carte / 📅 Calendrier
- Cliquer "📅 Calendrier" → la grille du mois en cours s'affiche
- Les QuickDateFilter (Aujourd'hui / Cette semaine / Ce week-end) disparaissent en vue calendrier

- [ ] **Étape 3 : Tester la grille**

- Les jours du mois courant sont affichés (fond normal)
- Les jours hors du mois sont grisés
- Aujourd'hui a son numéro sur fond doré
- Les jours avec événements affichent un compteur doré

- [ ] **Étape 4 : Tester le clic sur un jour**

- Cliquer sur un jour avec événements → une liste apparaît sous la grille
- Chaque item est un lien vers la page détail de l'événement
- Cliquer à nouveau sur le même jour → la liste se referme

- [ ] **Étape 5 : Tester la navigation mois**

- Cliquer ◀ → passe au mois précédent, les événements du nouveau mois se chargent
- Cliquer ▶ → passe au mois suivant

- [ ] **Étape 6 : Push**

```bash
git push origin develop
```
