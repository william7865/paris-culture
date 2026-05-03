# Spec — Mode sombre / clair

**Date :** 2026-05-04
**Statut :** Approuvé

---

## Objectif

Ajouter un toggle ☾/☀ dans le header permettant de basculer entre le thème sombre (défaut actuel) et un thème clair. La préférence est sauvegardée en `localStorage` et restaurée au rechargement.

---

## Comportement utilisateur

- Par défaut, l'app s'ouvre en thème **sombre** (comportement actuel inchangé).
- Si l'utilisateur a déjà choisi un thème, `localStorage` est lu au démarrage et le thème est appliqué avant le premier render (pas de flash).
- Dans le header, un bouton affiche :
  - **☾ Clair** quand le thème sombre est actif (cliquer passe au clair)
  - **☀ Sombre** quand le thème clair est actif (cliquer passe au sombre)
- Le changement est instantané, toute l'app bascule d'un coup grâce aux variables CSS.

---

## Architecture

### `frontend/src/index.css` — Thème clair

Ajouter un bloc `[data-theme="light"]` qui surcharge uniquement les variables de couleur :

```css
[data-theme="light"] {
  --bg:        #f5f3ef;
  --surface:   #edeae3;
  --card:      #ffffff;
  --card-hover:#f7f5f0;
  --border:    #e0ddd6;
  --text:      #1a1713;
  --muted:     #7a6f60;
  --cream:     #1a1713;
  --shadow:    0 8px 32px rgba(0,0,0,.12);
}
```

`--gold`, `--gold-light`, `--error`, `--font-*`, `--radius-*` restent inchangés — ils fonctionnent dans les deux thèmes.

L'attribut `data-theme="light"` est posé sur `document.documentElement` (`<html>`). Sans attribut = thème sombre par défaut (CSS existant dans `:root`).

### `frontend/src/context/ThemeContext.jsx` — Nouveau fichier

```jsx
// Expose : { theme: 'dark'|'light', toggleTheme }
// Lit localStorage au démarrage, applique data-theme sur <html>
// Écrit dans localStorage à chaque toggle
```

Initialisation sans flash : lire `localStorage` dans la fonction d'initialisation de `useState`, appliquer l'attribut immédiatement dans un `useEffect` synchrone (ou dans le script d'init).

### `frontend/src/main.jsx` — Wrapping

Ajouter `ThemeProvider` autour de l'app, dans la même hiérarchie que `ToastProvider` et `AuthProvider`. Ordre : `ToastProvider > ThemeProvider > AuthProvider > App`.

### `frontend/src/components/Header.jsx` — Bouton toggle

Consommer `useTheme()` dans `Header`. Ajouter un bouton à droite de la navigation :
- Label : `☾ Clair` si `theme === 'dark'`, `☀ Sombre` si `theme === 'light'`
- `aria-label` : `"Passer au thème clair"` / `"Passer au thème sombre"`
- `onClick` : appelle `toggleTheme()`
- Style : bouton pill (border-radius 20px), s'intègre à la nav existante

---

## Hors scope

- Détecter automatiquement `prefers-color-scheme` du système — trop de cas limites, la préférence manuelle prime.
- Persistance côté serveur (BDD) — localStorage suffit.
- Transitions animées entre les thèmes — CSS `transition` sur `background`/`color` peut causer des flashs sur certains éléments, hors scope.
