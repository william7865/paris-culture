# Spec — Filtres avancés

**Date :** 2026-05-04
**Statut :** Approuvé

---

## Objectif

Ajouter un panneau collapsible "Filtres" dans la barre de recherche de Home.jsx exposant deux nouveaux critères : arrondissement et gratuit seulement. Les filtres existants (catégorie, date rapide, recherche texte) restent inchangés.

---

## Comportement utilisateur

- Un bouton **"Filtres"** apparaît à droite de la barre de filtres existante.
- Si des filtres avancés sont actifs, le bouton affiche un badge : **"Filtres (2)"**.
- Cliquer ouvre/ferme un panneau en dessous de la barre.
- Le panneau contient :
  - Un `<select>` **Arrondissement** : "Tous les arrondissements", "1er", "2ème", …, "20ème"
  - Une checkbox **"Gratuit seulement"**
- Tout changement de filtre remet la pagination à la page 1.
- Les filtres avancés s'appliquent aussi à la vue carte (MapView).

---

## Architecture

### `frontend/src/components/AdvancedFilters.jsx` — Nouveau fichier

Composant contrôlé recevant les props :

```jsx
<AdvancedFilters
  arrondissement={arrondissement}   // string: 'all' | '1' | '2' | … | '20'
  freeOnly={freeOnly}               // boolean
  onArrondissementChange={fn}
  onFreeOnlyChange={fn}
/>
```

Rendu : deux contrôles dans un `<div className="advanced-filters">`.

Le select arrondissement génère les options :
- `value="all"` → "Tous les arrondissements"
- `value="1"` → "1er arrondissement"
- `value="2"` à `value="9"` → "Nème arrondissement"
- `value="10"` à `value="20"` → "Nème arrondissement"

### `frontend/src/pages/Home.jsx` — Modifications

Deux nouveaux états :
```jsx
const [arrondissement, setArrondissement] = useState('all');
const [freeOnly, setFreeOnly] = useState(false);
```

Bouton toggle dans la barre de filtres :
```jsx
const advancedCount = (arrondissement !== 'all' ? 1 : 0) + (freeOnly ? 1 : 0);
```

Le bouton affiche `Filtres${advancedCount > 0 ? ` (${advancedCount})` : ''}`.

`arrondissement` et `freeOnly` sont passés au hook `useEvents` et à `fetchMapEvents`.

### `frontend/src/api/events.js` — Modifications

`fetchEvents` et `fetchMapEvents` transmettent les nouveaux params :
```js
if (arrondissement && arrondissement !== 'all') params.set('arrondissement', arrondissement);
if (freeOnly) params.set('free', '1');
```

### `backend/routes/events.js` — Modifications

Validation et traitement de deux nouveaux query params :

**`arrondissement`** — entier 1–20 ou absent :
```js
const arr = parseInt(req.query.arrondissement, 10);
const arrondissementCondition = (!isNaN(arr) && arr >= 1 && arr <= 20)
  ? `address_zipcode = "750${String(arr).padStart(2, '0')}"`
  : null;
```

**`free`** — `'1'` ou absent :
```js
const freeCondition = req.query.free === '1' ? `price_type = "gratuit"` : null;
```

Ces conditions s'ajoutent aux conditions WHERE existantes (AND).

Les deux nouvelles conditions s'appliquent aussi à la route `/map`.

---

## CSS

Nouveau fichier ou section dans `index.css` :

```css
.advanced-filters-toggle { /* bouton Filtres */ }
.advanced-filters-toggle--active { /* quand panneau ouvert */ }
.advanced-filters { /* panneau collapsible */ }
.advanced-filters__select { /* select arrondissement */ }
.advanced-filters__checkbox-label { /* label checkbox gratuit */ }
```

Le panneau utilise `display: none` / `display: flex` selon état `showAdvanced` dans Home.jsx.

---

## Hors scope

- Filtre par plage de dates personnalisée — couvert par la vue calendrier
- Filtre par prix exact (payant/gratuit sous conditions)
- Persistance des filtres avancés en localStorage
