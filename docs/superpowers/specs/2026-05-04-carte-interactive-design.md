# Spec — Carte interactive des événements

**Date :** 2026-05-04
**Statut :** Approuvé

---

## Objectif

Ajouter une vue carte interactive à la page d'accueil de Paris Culture. L'utilisateur peut basculer entre la grille de cartes existante et une carte Leaflet.js affichant les événements sous forme de pins géolocalisés. Les mêmes filtres (recherche, catégorie, date) s'appliquent aux deux vues.

---

## Comportement utilisateur

- Sur la page d'accueil, un toggle **☰ Liste / 🗺 Carte** apparaît à droite du compteur de résultats.
- En vue Carte : la grille disparaît, remplacée par une carte Leaflet pleine largeur centrée sur Paris.
- Les filtres (SearchBar, CategoryFilter, QuickDateFilter) restent visibles et fonctionnels. Chaque changement de filtre recharge les pins.
- Cliquer sur un pin ouvre une popup Leaflet avec : image de couverture (ou fallback 🗼), tag de catégorie coloré, titre, date de début, adresse, et un bouton "Voir le détail →" qui navigue vers `/events/:id`.
- Les événements sans coordonnées GPS valides sont silencieusement ignorés (pas de pin, pas d'erreur).
- La pagination n'existe pas en vue Carte : on charge jusqu'à 100 événements filtrés.

---

## Architecture

### Backend — `backend/routes/events.js`

**Ajout du champ `location` aux SELECT_FIELDS existants :**
```
id,url,title,lead_text,date_start,date_end,address_name,address_zipcode,qfap_tags,cover_url,price_type,location
```

**Nouvelle route `GET /api/events/map` :**
- Accepte les mêmes paramètres de filtre que `GET /api/events` : `q`, `category`, `dateFilter`.
- Pas de `page` — fixe `limit: 100`, `offset: 0`.
- Réutilise la même logique de construction des conditions ODSQL (`dateCondition`, `category`, `q`).
- Filtre les résultats sans `location` valide avant de répondre.
- Utilise le cache TTL existant, clé préfixée `map:`.
- Réponse : `{ results: [...événements avec location...] }`

### Frontend — nouveaux fichiers

**`frontend/src/api/events.js`** — nouvelle fonction :
```js
fetchMapEvents({ q, category, dateFilter })
// → GET /api/events/map?q=...&category=...&dateFilter=...
// → retourne { results: [...] }
```

**`frontend/src/components/MapView.jsx`** — composant carte :
- Reçoit les props : `q`, `category`, `dateFilter`.
- Appelle `fetchMapEvents` dans un `useEffect` sur changement des props.
- Gère les états loading (message centré) et erreur (silencieux, la carte reste vide).
- Rend un `<MapContainer>` react-leaflet centré sur Paris (`[48.8566, 2.3522]`, zoom 12).
- Tiles OpenStreetMap : `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`.
- Un `<Marker>` par événement avec coordonnées `[location.lat, location.lon]`.
- Au clic sur un Marker → `<Popup>` Leaflet avec mini-card de l'événement.
- Fix du bug d'icône Leaflet/Vite : redéfinition manuelle des URLs d'icônes via `L.Icon.Default.mergeOptions`.

**`frontend/src/pages/Home.jsx`** — modifications :
- Ajout d'un état `const [view, setView] = useState('list')`.
- Toggle rendu dans `.controls__row`, à droite du compteur de résultats :
  ```jsx
  <div className="view-toggle">
    <button aria-pressed={view === 'list'} onClick={() => setView('list')}>☰ Liste</button>
    <button aria-pressed={view === 'map'}  onClick={() => setView('map')}>🗺 Carte</button>
  </div>
  ```
- Conditionnel dans le JSX : si `view === 'map'` → `<MapView q={q} category={category} dateFilter={dateFilter} />`, sinon la grille + pagination existantes.
- La pagination est cachée en vue carte (pas de changement logique, juste conditionnelle).

**`frontend/src/index.css`** — ajouts :
- Import du CSS Leaflet (dans `main.jsx` en réalité : `import 'leaflet/dist/leaflet.css'`).
- Styles `.view-toggle` : deux boutons côte à côte, bouton actif fond sombre.
- `.map-container` : hauteur fixe `calc(100vh - 280px)`, min-height `500px`.

### Librairies

```bash
cd frontend && npm install leaflet react-leaflet
```

---

## Ce qui ne change pas

- Routes `/api/events` et `/api/events/:id` — inchangées.
- Composants `EventCard`, `SearchBar`, `CategoryFilter`, `QuickDateFilter` — inchangés.
- Pages `EventDetail`, `Favorites`, `Account` — inchangées.
- Logique de favoris, auth, toasts — inchangée.

---

## Contraintes et cas limites

- **Événements sans GPS** : l'Open Data Paris ne géolocalise pas tous les événements. On filtre côté backend (`location != null`), pas d'erreur côté client.
- **Bug Leaflet + Vite** : les icônes de marqueurs par défaut sont cassées avec Vite. Fix via `L.Icon.Default.mergeOptions({ iconUrl, shadowUrl })` dans `MapView.jsx` au module level.
- **Import CSS Leaflet** : doit être importé dans `main.jsx` avant le CSS de l'app pour éviter des conflits de z-index.
- **Hauteur de la carte** : la carte doit avoir une hauteur CSS explicite, sinon elle ne s'affiche pas (contrainte Leaflet).
- **React StrictMode** : react-leaflet est compatible avec StrictMode depuis la v4.

---

## Hors scope

- Clustering de pins (trop de markers rapprochés) — pas nécessaire pour 100 événements.
- Géolocalisation de l'utilisateur ("événements près de moi").
- Mini-carte sur la page détail.
- Sauvegarde de la vue (liste/carte) dans l'URL ou localStorage.
