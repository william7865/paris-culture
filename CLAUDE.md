# Paris Culture — Guide développement complet

## Contexte projet

Application web pour trouver des événements culturels à Paris (concerts, expos, théâtre,
sport…). Exercice technique pour un entretien chez Webdentiste (stage full-stack IA).

Contrainte : 3-4h max, projet incomplet OK, l'important = choix techniques justifiables.
Les recruteurs lisent le git log — chaque commit doit être propre et logique.

---

## Stack

| Couche    | Techno            | Pourquoi                                                        |
|-----------|-------------------|-----------------------------------------------------------------|
| Backend   | Node.js + Express | Léger, rapide, JS isomorphe, bonne interop avec l'API Open Data |
| Frontend  | React 18 + Vite   | Composants, hooks, DX rapide, proxy intégré                     |
| Données   | Open Data Paris   | Gratuite, sans clé, officielle, données temps réel              |
| Docker    | docker-compose    | Bonus : déploiement reproductible en une commande               |

---

## API source — Que Faire à Paris

```
GET https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/que-faire-a-paris-/records
```

**Paramètres :**
- `limit` / `offset` — pagination
- `where` — ODSQL : `tags like "%concerts%"` / `search(title, "jazz")` / `date_end >= "2024-01-01"`
- `order_by` — `date_start desc`
- `select` — sélectionner uniquement les champs nécessaires (performance)

**Champs à utiliser :**
- `url_name` — slug unique → sert d'ID dans le routing (`/events/:urlName`)
- `title`, `lead_text`, `description` (HTML)
- `date_start`, `date_end` — ISO 8601
- `address_name`, `address_zipcode`
- `tags` — catégories séparées par `;` (concerts, expositions, spectacles, cinéma, sports, théâtre, jeunesse)
- `cover_url`, `url`, `price_type` ("gratuit" / "payant" / "gratuit sous conditions")

**fetch natif Node 18+** — pas besoin d'axios.

---

## Architecture

```
paris-culture/
├── backend/
│   ├── middleware/
│   │   └── cache.js          → cache mémoire TTL
│   ├── routes/
│   │   └── events.js         → GET /api/events, GET /api/events/:urlName
│   ├── .env.example
│   ├── Dockerfile
│   └── index.js              → Express app entry point
└── frontend/
    └── src/
        ├── api/
        │   └── events.js     → fetchEvents(), fetchEvent()
        ├── components/
        │   ├── CategoryFilter.jsx
        │   ├── EventCard.jsx
        │   ├── Loader.jsx
        │   └── SearchBar.jsx
        ├── hooks/
        │   └── useEvents.js  → custom hook (état loading/error/data)
        ├── pages/
        │   ├── Home.jsx
        │   └── EventDetail.jsx
        ├── App.jsx
        ├── index.css
        └── main.jsx
```

Le frontend proxy `/api/*` → `http://localhost:3001` via Vite (évite CORS en dev).
En prod Docker, le frontend build est servi par nginx qui proxie aussi `/api`.

---

## Backend — ce que chaque fichier doit faire

### `index.js`
- `helmet()` — headers sécurité HTTP
- `cors({ origin: process.env.ALLOWED_ORIGIN })` — CORS restreint
- `compression()` — gzip des réponses
- `express.json({ limit: '10kb' })` — limite taille body
- `rateLimit` — max 100 req/15min par IP
- `morgan('dev')` — logging des requêtes en dev
- Route `/api/health` — endpoint de santé (utile pour Docker healthcheck)
- Graceful shutdown sur `SIGTERM` / `SIGINT`

### `routes/events.js`
- Valider `page` : doit être entier positif, sinon 400
- Valider `category` : doit être dans la liste autorisée ou "all", sinon ignorer
- Sanitiser `q` : trim, max 100 chars, pas d'injection ODSQL
- Toujours filtrer `date_end >= aujourd'hui` pour n'afficher que les événements à venir
- Utiliser `select=` pour ne demander que les champs utiles à l'API Open Data
- Wrapper les appels fetch dans try/catch, logger l'erreur interne, répondre message générique
- Réponse list : `{ results, total_count, page, limit }`
- Réponse 404 si `url_name` inconnu

### `middleware/cache.js`
```js
// Cache mémoire simple avec TTL (5 minutes)
// Map<key, { data, expiresAt }>
// Fonctions : get(key), set(key, data, ttlMs), clear()
// Utiliser comme middleware Express ou fonction utilitaire dans les routes
```

### `.env.example`
```
PORT=3001
ALLOWED_ORIGIN=http://localhost:3000
CACHE_TTL_MS=300000
```

### `package.json` backend — dépendances
```
express, cors, helmet, compression, morgan, express-rate-limit, dotenv
devDependencies: nodemon
```

---

## Frontend — ce que chaque fichier doit faire

### `vite.config.js`
- Proxy `/api` → `http://localhost:3001`
- Port 3000

### `src/api/events.js`
- `fetchEvents({ q, category, page })` → GET /api/events
- `fetchEvent(urlName)` → GET /api/events/:urlName
- Throws une Error avec message lisible si réponse non-ok

### `src/hooks/useEvents.js`
Custom hook qui encapsule : état `{ data, loading, error }`, appel `fetchEvents`,
dépendances `q`, `category`, `page`. Annule le fetch précédent avec `AbortController`
si les paramètres changent avant la fin du fetch.

### `src/components/SearchBar.jsx`
- Debounce 400ms avant de propager la valeur au parent (évite un appel API à chaque frappe)
- Bouton clear (×) si champ non vide
- `aria-label` sur l'input
- Touche Entrée déclenche la recherche immédiatement sans attendre le debounce

### `src/components/CategoryFilter.jsx`
- Liste : Tous / Concerts / Expositions / Spectacles / Cinéma / Sports / Théâtre / Jeunesse
- `aria-pressed` sur chaque bouton
- `role="group"` avec `aria-label="Filtrer par catégorie"`

### `src/components/EventCard.jsx`
- `Link` vers `/events/${event.url_name}` avec `state={{ event }}` (évite un re-fetch)
- `loading="lazy"` sur l'image
- Fallback si pas de `cover_url` (placeholder emoji ou couleur)
- Vérifier l'existence de chaque champ avant affichage (`?.`)
- Badge catégorie coloré (couleur différente par catégorie)
- Badge "Gratuit" si `price_type === "gratuit"`
- Date formatée en français (`toLocaleDateString('fr-FR')`)
- Truncate la description à 2 lignes max (CSS `line-clamp`)

### `src/components/Loader.jsx`
- Skeleton cards (rectangles animés) plutôt qu'un spinner — meilleure UX perçue
- Afficher 6 skeletons pour simuler la grille

### `src/pages/Home.jsx`
- Utilise le hook `useEvents`
- Reset `page` à 1 quand `q` ou `category` change
- Trois états : loading (skeletons), error (message + bouton retry), empty (message)
- Affiche le total : "X événements trouvés"
- Pagination : boutons Précédent / Suivant + indicateur "Page X / Y"

### `src/pages/EventDetail.jsx`
- Lire l'event depuis `useLocation().state?.event` si dispo (navigation depuis la liste)
- Sinon fetch via `fetchEvent(urlName)` (accès direct par URL)
- `dangerouslySetInnerHTML` uniquement pour le champ `description` de l'API (pas de contenu utilisateur)
- Afficher : image pleine largeur, tous les tags, titre h1, description, dates complètes, adresse, lien officiel
- Bouton retour ← vers la liste
- Gérer loading et error

### `src/index.css`
- Reset CSS minimal (box-sizing, margin 0, font)
- Variables CSS : `--color-primary`, `--color-bg`, `--color-card`, `--radius`, `--shadow`
- Header sombre avec logo 🗼
- Grille responsive : `grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))`
- Cards : border-radius, box-shadow, transition hover (translateY -4px)
- Skeleton animation : `@keyframes shimmer` avec gradient animé
- Badges catégories : couleur différente par mot-clé dans le tag
- États empty et error centrés
- Responsive mobile : 1 colonne sous 600px

### `package.json` frontend — dépendances
```
react, react-dom, react-router-dom
devDependencies: vite, @vitejs/plugin-react
```

---

## Sécurité — checklist complète

**Backend :**
- [ ] `helmet()` activé (Content-Security-Policy, X-Frame-Options, X-Content-Type-Options…)
- [ ] CORS : `origin` explicite, pas `*` en prod
- [ ] Rate limiting : `express-rate-limit` sur toutes les routes `/api`
- [ ] Validation `page` : parseInt + isNaN + > 0, sinon 400
- [ ] Validation `category` : whitelist des valeurs autorisées
- [ ] Sanitisation `q` : trim, maxLength 100, pas de guillemets non échappés dans la requête ODSQL
- [ ] Pas de stack trace dans les réponses d'erreur client
- [ ] `express.json({ limit: '10kb' })` pour limiter les bodies
- [ ] `.env` dans `.gitignore`, uniquement `.env.example` committé
- [ ] Pas de secret hardcodé dans le code

**Frontend :**
- [ ] `dangerouslySetInnerHTML` uniquement sur `description` (champ API officiel, pas user-generated)
- [ ] Vérification existence champs API avant utilisation (`?.`)
- [ ] Pas de données sensibles dans le localStorage
- [ ] Liens externes avec `rel="noopener noreferrer"`

---

## Performance — checklist complète

**Backend :**
- [ ] Cache mémoire TTL 5min sur les réponses Open Data
- [ ] `compression()` gzip activé
- [ ] Param `select=` sur l'API Open Data (ne fetch que les champs utilisés)
- [ ] Param `where=date_end >= aujourd'hui` pour réduire le volume de données

**Frontend :**
- [ ] `loading="lazy"` sur toutes les images EventCard
- [ ] Debounce 400ms sur SearchBar
- [ ] `AbortController` dans le hook pour annuler les fetches obsolètes
- [ ] `React.memo` sur EventCard (évite re-render si props identiques)
- [ ] `useCallback` sur les handlers passés en props
- [ ] Skeleton loader plutôt que spinner (évite le layout shift)
- [ ] Lazy loading des pages avec `React.lazy` + `Suspense`

---

## Accessibilité — checklist

- [ ] Toutes les images ont un `alt`
- [ ] Boutons avec `aria-label` si pas de texte visible
- [ ] `aria-pressed` sur CategoryFilter
- [ ] `role="group"` + `aria-label` sur CategoryFilter
- [ ] Contraste couleurs suffisant (WCAG AA)
- [ ] Navigation clavier fonctionnelle (focus visible)
- [ ] `<main>`, `<header>`, `<footer>` — landmarks sémantiques
- [ ] `<h1>` unique par page, hiérarchie `h2`/`h3` cohérente
- [ ] Liens avec texte descriptif (pas "cliquez ici")

---

## Gestion d'erreurs — patterns à suivre

**Backend (toutes les routes) :**
```js
try {
  // logique
} catch (err) {
  console.error(`[events] ${err.message}`); // log interne seulement
  res.status(500).json({ error: 'Impossible de récupérer les événements' });
}
```

**Frontend (fetch) :**
```js
if (!res.ok) {
  const err = await res.json().catch(() => ({}));
  throw new Error(err.error || 'Erreur serveur');
}
```

**Codes HTTP à respecter :**
- `200` OK
- `400` Bad Request (param invalide)
- `404` Not Found (événement inconnu)
- `429` Too Many Requests (rate limit)
- `500` Internal Server Error

---

## Docker — ce que chaque fichier doit faire

### `backend/Dockerfile`
- Base : `node:20-alpine`
- `npm ci --omit=dev` (pas les devDependencies en prod)
- User non-root : `USER node`
- `EXPOSE 3001`

### `frontend/Dockerfile`
- Multi-stage : stage 1 build Vite → stage 2 nginx:alpine sert le `dist/`
- nginx proxie `/api/*` vers le service backend
- `EXPOSE 80`

### `docker-compose.yml`
- Service `backend` : build + port 3001, healthcheck sur `/api/health`
- Service `frontend` : build + port 3000, `depends_on: backend`
- Variables d'env via `environment` ou `env_file`

### `.dockerignore` (backend et frontend)
```
node_modules
.env
*.log
```

---

## Workflow Git

**Branches :**
- `main` — code stable, première chose que les recruteurs voient
- `develop` — branche de travail, tous les commits vont ici

**Règle absolue : ne jamais committer directement sur `main`.**

**Workflow à suivre :**
```bash
# Toujours travailler sur develop
git checkout develop

# Après chaque étape fonctionnelle
git add .
git commit -m "feat(backend): ..."
git push origin develop

# À la toute fin — ouvrir une PR develop → main sur GitHub
# La PR est visible par les recruteurs et montre le workflow d'équipe
```

**Initialisation du repo (à faire une seule fois) :**
```bash
git init

# Premier commit sur main (structure du projet + .gitignore + CLAUDE.md)
git add .gitignore .github/ CLAUDE.md backend/ frontend/
git commit -m "chore: setup structure du projet"
git remote add origin https://github.com/TON_USERNAME/paris-culture.git
git push -u origin main

# Créer develop à partir de main — tout le vrai travail se fait ici
git checkout -b develop
git push -u origin develop
```

**Dernière étape avant d'envoyer le lien :**
1. Merger `develop` → `main` via une Pull Request sur GitHub
2. La PR doit avoir un titre clair : "feat: application Paris Culture complète"
3. Envoyer le lien du repo (pas de la PR) à nhugon@webdentiste.eu

---

## Conventions de code

**Commits :**
- `feat:` nouvelle fonctionnalité
- `fix:` correction de bug
- `style:` CSS / formatting
- `docs:` documentation
- `chore:` config, deps, setup
- `refactor:` restructuration sans nouvelle feature

**Nommage :**
- Composants React : PascalCase (`EventCard.jsx`)
- Fonctions/variables : camelCase
- Constantes globales : UPPER_SNAKE_CASE
- CSS classes : kebab-case

**Code :**
- Pas de `console.log` de debug oublié
- Pas de variable non utilisée
- Opérateur `?.` pour les accès à des champs potentiellement absents
- Pas de magic numbers — nommer les constantes (`const DEBOUNCE_MS = 400`)
- Un composant = un fichier = une responsabilité

---

## .gitignore — ce qui ne doit pas être committé

```
node_modules/
.env
*.log
dist/
.DS_Store
CONSIGNES.md
PLAN.md
```

---

## Lancement dev

```bash
# Terminal 1 — Backend
cd backend
cp .env.example .env
npm install
npm run dev        # nodemon, port 3001

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev        # Vite, port 3000
```

## Lancement Docker

```bash
docker-compose up --build
# Frontend → http://localhost:3000
# Backend  → http://localhost:3001
```

---

## Pistes d'amélioration (à mentionner à l'entretien)

- **Carte interactive** : Leaflet.js pour visualiser les événements géolocalisés
- **Favoris** : persistance localStorage + page dédiée
- **Cache Redis** : remplacer le cache mémoire par Redis pour multi-instance
- **CI/CD** : GitHub Actions — lint + test + build + deploy sur push main
- **Tests** : Jest + Supertest pour le backend, React Testing Library pour le frontend
- **PWA** : Service Worker pour consultation offline
- **Internationalisation** : i18n pour EN/FR
