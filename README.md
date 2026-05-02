# Paris Culture

> Agenda culturel parisien — concerts, expositions, théâtre, sport et bien plus.

![CI](https://github.com/lnwilliam/paris-culture/actions/workflows/ci.yml/badge.svg?branch=develop)
![Node](https://img.shields.io/badge/node-20%2B-brightgreen)
![React](https://img.shields.io/badge/react-18-blue)
![Docker](https://img.shields.io/badge/docker-compose-2496ED)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

---

## Aperçu

Application full-stack permettant de rechercher, filtrer et sauvegarder des événements culturels parisiens en temps réel, alimentée par l'[API Open Data Paris](https://opendata.paris.fr).

Interface éditoriale sombre inspirée des magazines culturels — typographie Cormorant Garamond + Bricolage Grotesque, palette chaleureuse sur fond nuit.

---

## Fonctionnalités

**Découverte d'événements**
- Recherche textuelle avec debounce 400 ms
- Filtres rapides : Aujourd'hui / Cette semaine / Ce week-end
- Filtres par catégorie : Concert, Expo, Festival, Théâtre, Sport, Cinéma, Jeunesse
- Tri : date croissante / décroissante / gratuit en premier
- Pagination avec compteur de résultats
- Carte featured (premier événement mis en avant)
- Événements similaires sur la page de détail

**Compte utilisateur**
- Inscription / connexion par email + mot de passe (JWT 7 jours)
- Favoris synchronisés côté serveur (PostgreSQL)
- Filtrage et tri des favoris
- Page Mon Compte : modifier email, changer de mot de passe, supprimer le compte
- Déconnexion automatique sur token expiré

**Confort d'usage**
- Événements récemment consultés (localStorage, 5 max)
- Export vers le calendrier (.ics iCalendar)
- Partage natif (Web Share API) avec fallback presse-papier
- Notifications toast (succès / erreur / info)
- Page 404 personnalisée
- Scroll automatique en haut à chaque navigation
- Titres de pages dynamiques
- PWA-ready (manifest.json + favicon SVG)

---

## Stack technique

| Couche      | Techno                    | Rôle                                                   |
|-------------|---------------------------|--------------------------------------------------------|
| Backend     | Node.js 20 + Express      | API REST, proxy vers Open Data Paris, cache mémoire    |
| Auth        | jsonwebtoken + bcryptjs   | JWT stateless, hash bcrypt (salt 10)                   |
| Base de données | PostgreSQL 16 + pg    | Comptes utilisateurs, favoris (JSONB)                  |
| Frontend    | React 18 + Vite           | SPA, routing, état global via Context                  |
| CI/CD       | GitHub Actions            | Build + audit sur PR, push image GHCR sur main         |
| Docker      | docker-compose            | Déploiement 3 services en une commande                 |
| Données     | Open Data Paris (ODSQL)   | Source officielle, gratuite, sans clé API              |

---

## Architecture

```
Browser
   │
   ▼
Frontend (React + Vite)  :3000
   │  /api/*
   ▼
Backend (Express)        :3001
   │  ├─ cache mémoire TTL 5 min
   │  ├─ rate limit 100 req/15 min
   │  └─ JWT middleware (routes protégées)
   ├──────────────────────────────▶  Open Data Paris API
   └──────────────────────────────▶  PostgreSQL :5432
```

Le frontend ne contacte jamais directement l'API externe — tout transite par le backend qui assure cache, validation et sécurité.

---

## Lancement en développement

### Prérequis

- Node.js 20+
- PostgreSQL 16+ (local ou via Docker)

### Installation

```bash
git clone https://github.com/lnwilliam/paris-culture.git
cd paris-culture

# Backend
cd backend
cp .env.example .env        # éditer les variables si besoin
npm install
npm run dev                 # http://localhost:3001

# Frontend (nouveau terminal)
cd ../frontend
npm install
npm run dev                 # http://localhost:3000
```

### Variables d'environnement

```env
# backend/.env
PORT=3001
ALLOWED_ORIGIN=http://localhost:3000
CACHE_TTL_MS=300000
DATABASE_URL=postgres://paris:paris@localhost:5432/parisculture
JWT_SECRET=change_me_in_production
```

La base de données se crée automatiquement au démarrage (`backend/src/migrations/001_init.sql`).

---

## Lancement avec Docker

```bash
docker-compose up --build
```

| Service  | URL                                     |
|----------|-----------------------------------------|
| Frontend | http://localhost:3000                   |
| Backend  | http://localhost:3001                   |
| Health   | http://localhost:3001/api/health        |

Les trois services démarrent dans l'ordre : `db` → `backend` → `frontend`, grâce aux healthchecks.

---

## API Backend

### Événements (public)

| Méthode | Route               | Description                        |
|---------|---------------------|------------------------------------|
| GET     | `/api/health`       | Statut du serveur                  |
| GET     | `/api/events`       | Liste paginée avec filtres         |
| GET     | `/api/events/:id`   | Détail d'un événement par ID       |

**Paramètres de `/api/events` :**

| Param        | Type   | Défaut     | Valeurs autorisées                                                |
|--------------|--------|------------|-------------------------------------------------------------------|
| `q`          | string | `""`       | Texte libre (max 100 chars, sanitisé)                             |
| `category`   | string | `all`      | `Concert` `Expo` `Festival` `Ecrans` `Sport` `Théâtre` `Enfants` |
| `page`       | number | `1`        | Entier positif                                                    |
| `sort`       | string | `date_asc` | `date_asc` `date_desc` `free_first`                               |
| `dateFilter` | string | `""`       | `today` `week` `weekend`                                          |

### Authentification

| Méthode | Route                    | Auth | Description                  |
|---------|--------------------------|------|------------------------------|
| POST    | `/api/auth/register`     | —    | Créer un compte               |
| POST    | `/api/auth/login`        | —    | Se connecter, reçoit un JWT  |

### Favoris (JWT requis)

| Méthode | Route                       | Description                       |
|---------|-----------------------------|-----------------------------------|
| GET     | `/api/favorites`            | Liste des favoris de l'utilisateur |
| POST    | `/api/favorites`            | Ajouter un favori                 |
| DELETE  | `/api/favorites/:eventId`   | Supprimer un favori               |

### Compte (JWT requis)

| Méthode | Route              | Description              |
|---------|--------------------|--------------------------|
| PUT     | `/api/account/email`    | Modifier l'adresse email |
| PUT     | `/api/account/password` | Changer le mot de passe  |
| DELETE  | `/api/account`          | Supprimer le compte      |

---

## Sécurité

- `helmet()` — headers HTTP sécurisés (CSP, X-Frame-Options…)
- CORS restreint à `ALLOWED_ORIGIN`
- Rate limiting : 100 requêtes / 15 min par IP
- Validation des inputs (`page`, `category`, `q`) côté backend
- Mots de passe hachés avec bcrypt (salt 10)
- JWT : secret en variable d'environnement, expiry 7 jours
- Aucun secret hardcodé, `.env` dans `.gitignore`
- `dangerouslySetInnerHTML` uniquement sur le champ `description` de l'API officielle

---

## CI/CD

**GitHub Actions — deux workflows :**

| Workflow | Déclencheur                     | Étapes                          |
|----------|---------------------------------|---------------------------------|
| `ci.yml` | Push `develop`, PR → `develop`  | Install + build + `npm audit`   |
| `cd.yml` | Push `main`                     | Build image Docker → GHCR       |

L'image Docker est publiée sur `ghcr.io/lnwilliam/paris-culture-backend`.

---

## Structure du projet

```
paris-culture/
├── .github/workflows/
│   ├── ci.yml
│   └── cd.yml
├── backend/
│   ├── middleware/
│   │   ├── cache.js          → cache mémoire TTL
│   │   └── auth.js           → middleware JWT
│   ├── routes/
│   │   ├── events.js         → GET /api/events, GET /api/events/:id
│   │   ├── auth.js           → POST register/login
│   │   ├── favorites.js      → CRUD favoris
│   │   └── account.js        → gestion compte
│   ├── src/
│   │   ├── db.js             → pool PostgreSQL
│   │   └── migrations/
│   │       └── 001_init.sql
│   ├── .env.example
│   ├── Dockerfile
│   └── index.js
└── frontend/
    ├── public/
    │   ├── manifest.json     → PWA manifest
    │   └── favicon.svg
    ├── src/
    │   ├── api/events.js
    │   ├── components/
    │   │   ├── CategoryFilter.jsx
    │   │   ├── EventCard.jsx
    │   │   ├── Footer.jsx
    │   │   ├── Header.jsx
    │   │   ├── Loader.jsx
    │   │   ├── QuickDateFilter.jsx
    │   │   ├── RecentlyViewed.jsx
    │   │   ├── SearchBar.jsx
    │   │   └── SimilarEvents.jsx
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── ToastContext.jsx
    │   ├── hooks/
    │   │   ├── useEvents.js
    │   │   └── usePageTitle.js
    │   ├── pages/
    │   │   ├── Account.jsx
    │   │   ├── EventDetail.jsx
    │   │   ├── Favorites.jsx
    │   │   ├── Home.jsx
    │   │   └── NotFound.jsx
    │   ├── utils/eventActions.js → export .ics, Web Share API
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    ├── Dockerfile
    └── vite.config.js
```

---

## Pistes d'amélioration

- **Carte interactive** — Leaflet.js pour visualiser les événements géolocalisés
- **Cache Redis** — remplacer le cache mémoire (multi-instance ready)
- **Refresh tokens** — sessions longues durée sans re-login
- **Tests** — Jest + Supertest (backend) + React Testing Library (frontend)
- **Service Worker** — consultation offline, push notifications
- **i18n** — internationalisation EN/FR
- **Recherche avancée** — filtres par prix, arrondissement, accessibilité

---

## Source des données

[Que Faire à Paris ?](https://opendata.paris.fr/explore/dataset/que-faire-a-paris-/) — jeu de données officiel de la Ville de Paris, licence Open Database License (ODbL).

---

## Licence

MIT
