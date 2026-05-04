# Spec — Vue calendrier

**Date :** 2026-05-04
**Statut :** Approuvé

---

## Objectif

Ajouter une troisième option "Calendrier" dans le toggle de vue (liste / carte / calendrier). La vue calendrier affiche les événements sous forme de grille mensuelle. Cliquer sur un jour affiche la liste des événements de ce jour.

---

## Comportement utilisateur

- Le toggle de vue passe de 2 options (Liste / Carte) à 3 (Liste / Carte / Calendrier).
- En vue calendrier :
  - Grille du mois en cours (7 colonnes × 5–6 lignes).
  - En-tête : mois + année + boutons ◀ ▶ pour naviguer mois par mois.
  - Chaque jour qui a des événements affiche un point doré + le nombre d'événements.
  - Cliquer sur un jour affiche une liste des événements de ce jour sous la grille.
  - Si aucun événement ce jour-là, le clic est inactif.
- Les filtres existants (catégorie, recherche, filtres avancés) s'appliquent à la vue calendrier.

---

## Architecture

### Backend — Nouveaux params `dateFrom` / `dateTo`

`backend/routes/events.js` : deux nouveaux query params optionnels sur GET `/` et GET `/map` :

```js
// dateFrom et dateTo : format ISO "YYYY-MM-DD"
// dateFrom remplace le filtre default date_end >= today quand fourni
const dateFromCondition = req.query.dateFrom
  ? `date_end >= "${req.query.dateFrom}"`
  : `date_end >= "${today}"`;
const dateToCondition = req.query.dateTo
  ? `date_start <= "${req.query.dateTo}"`
  : null;
```

Quand `dateFrom` est fourni, il remplace la condition par défaut `date_end >= today`.
`dateTo` s'ajoute si fourni (AND).

### `frontend/src/api/events.js` — Modifications

`fetchEvents` transmet les nouveaux params :
```js
if (dateFrom) params.set('dateFrom', dateFrom);
if (dateTo) params.set('dateTo', dateTo);
```

Nouvelle fonction `fetchCalendarEvents({ q, category, arrondissement, freeOnly, dateFrom, dateTo })` — appelle GET `/api/events` avec `limit=200` et les params ci-dessus, sans pagination.

### `frontend/src/components/CalendarView.jsx` — Nouveau fichier

Props reçues :
```jsx
<CalendarView
  q={q}
  category={category}
  arrondissement={arrondissement}
  freeOnly={freeOnly}
/>
```

État interne :
```js
const [currentDate, setCurrentDate] = useState(new Date());  // mois affiché
const [events, setEvents] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [selectedDay, setSelectedDay] = useState(null);  // 'YYYY-MM-DD' | null
```

**Fetch :** à chaque changement de `currentDate` ou des filtres, fetch les événements du mois :
```js
const dateFrom = `${year}-${month}-01`;
const dateTo   = dernier jour du mois (new Date(year, month, 0) en ISO)
fetchCalendarEvents({ q, category, arrondissement, freeOnly, dateFrom, dateTo })
```

**Groupement :** les événements sont groupés par jour dans un `Map<'YYYY-MM-DD', event[]>` calculé en mémoire (un événement multi-jours apparaît sur chaque jour où il est actif, dans la plage du mois affiché).

**Rendu de la grille :**
```
┌─────────────────────────────────────────────────┐
│  ◀  Mai 2026  ▶                                 │
├──────┬──────┬──────┬──────┬──────┬──────┬───────┤
│ Lun  │ Mar  │ Mer  │ Jeu  │ Ven  │ Sam  │ Dim   │
├──────┼──────┼──────┼──────┼──────┼──────┼───────┤
│      │      │      │      │  1   │  2 • │  3 •• │
│  5 • │  6   │  7   │  8   │  9   │ 10 • │ 11    │
│ ...                                              │
└─────────────────────────────────────────────────┘
[ Liste des événements du jour sélectionné ]
```

- Jours hors du mois courant : affichés grisés, non cliquables.
- Jour avec événements : point doré (`•`) et nombre.
- Jour sélectionné : fond doré (bordure `var(--gold)`).
- En dessous de la grille : liste compacte des événements du `selectedDay` (titre + heure + lieu), chaque item est un `<Link>` vers la page détail.

### `frontend/src/pages/Home.jsx` — Modifications

- Toggle étendu à 3 options : `'list' | 'map' | 'calendar'`
- `{view === 'calendar' && <CalendarView q={q} category={category} arrondissement={arrondissement} freeOnly={freeOnly} />}`
- Les filtres quickDate sont masqués en vue calendrier (la navigation mois remplace ce besoin).

---

## CSS

Nouvelles classes dans `index.css` :

```css
.calendar { /* conteneur principal */ }
.calendar__header { /* ligne mois + nav */ }
.calendar__nav-btn { /* boutons ◀ ▶ */ }
.calendar__grid { /* display: grid; grid-template-columns: repeat(7, 1fr) */ }
.calendar__day-header { /* Lun Mar … */ }
.calendar__day { /* cellule jour */ }
.calendar__day--other-month { /* grisé */ }
.calendar__day--selected { /* fond doré */ }
.calendar__day--has-events { /* curseur pointer */ }
.calendar__dot { /* point doré */ }
.calendar__count { /* nombre d'événements */ }
.calendar__events { /* liste sous la grille */ }
.calendar__event-item { /* ligne événement */ }
```

---

## Hors scope

- Vue semaine ou vue agenda
- Glisser-déposer d'événements
- Événements multi-jours affichés en barre horizontale (type Google Calendar)
- Export iCal depuis la vue calendrier (déjà implémenté ailleurs)
