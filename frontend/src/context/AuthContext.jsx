import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getFavorites, addFavorite, removeFavorite } from '../api/favorites';

const AuthContext = createContext(null);

const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const [token, setToken]         = useState(() => localStorage.getItem('token') || null);
  const [favorites, setFavorites] = useState([]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setFavorites([]);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }, []);

  const login = useCallback((userData, jwt) => {
    setUser(userData);
    setToken(jwt);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', jwt);
  }, []);

  // Vérifie le token au démarrage et déconnecte si expiré
  useEffect(() => {
    if (token && isTokenExpired(token)) {
      logout();
      return;
    }
    if (!token) return;

    getFavorites(token)
      .then(setFavorites)
      .catch((err) => {
        if (err.message?.includes('401') || err.message?.toLowerCase().includes('token')) {
          logout();
        }
      });
  }, [token, logout]);

  const isFavorite = useCallback((eventId) =>
    favorites.some(f => f.id === eventId), [favorites]);

  const toggleFavorite = useCallback(async (event) => {
    if (!token) return;
    if (isFavorite(event.id)) {
      await removeFavorite(token, event.id);
      setFavorites(prev => prev.filter(f => f.id !== event.id));
    } else {
      await addFavorite(token, event);
      setFavorites(prev => [...prev, event]);
    }
  }, [token, isFavorite]);

  return (
    <AuthContext.Provider value={{ user, token, favorites, login, logout, isFavorite, toggleFavorite }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
