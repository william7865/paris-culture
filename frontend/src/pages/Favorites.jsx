import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import usePageTitle from '../hooks/usePageTitle';

export default function Favorites() {
  usePageTitle('Mes favoris');
  const { user, favorites, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return favorites;
    const q = search.toLowerCase();
    return favorites.filter(e =>
      e.title?.toLowerCase().includes(q) ||
      e.address_name?.toLowerCase().includes(q) ||
      e.qfap_tags?.toLowerCase().includes(q)
    );
  }, [favorites, search]);

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <button className="back-btn" onClick={() => navigate('/')}>← Retour</button>
          <div className="site-header__rule" />
          <span className="site-header__wordmark">Paris <span>Culture</span></span>
        </div>
      </header>

      <main className="container">
        <div className="favorites-header">
          <div>
            <h1 className="favorites-title">Mes favoris</h1>
            <p className="favorites-sub">{user?.email} · {favorites.length} événement{favorites.length > 1 ? 's' : ''}</p>
          </div>
          <div style={{ display: 'flex', gap: '.75rem' }}>
            <button className="header-btn" onClick={() => navigate('/compte')}>Mon compte</button>
            <button className="logout-btn" onClick={() => { logout(); navigate('/'); }}>Déconnexion</button>
          </div>
        </div>

        {favorites.length > 0 && (
          <div className="favorites-search">
            <input
              type="search"
              className="search-bar__input"
              placeholder="Filtrer mes favoris…"
              aria-label="Filtrer les favoris"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        )}

        {favorites.length === 0 && (
          <div className="state-message">
            <p>Aucun favori pour l'instant.</p>
          </div>
        )}

        {favorites.length > 0 && filtered.length === 0 && (
          <div className="state-message">
            <p>Aucun résultat pour « {search} ».</p>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="events-grid">
            {filtered.map((event, i) => (
              <EventCard key={event.id} event={event} style={{ animationDelay: `${i * 50}ms` }} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
