import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import Header from '../components/Header';
import Footer from '../components/Footer';
import usePageTitle from '../hooks/usePageTitle';

export default function Favorites() {
  usePageTitle('Mes favoris');
  const { user, favorites, logout } = useAuth();
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
      <Header backBtn />

      <main className="container">
        <div className="favorites-header">
          <div>
            <h1 className="favorites-title">Mes favoris</h1>
            <p className="favorites-sub">{user?.email} · {favorites.length} événement{favorites.length > 1 ? 's' : ''}</p>
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
          <div className="state-message"><p>Aucun favori pour l'instant.</p></div>
        )}

        {favorites.length > 0 && filtered.length === 0 && (
          <div className="state-message"><p>Aucun résultat pour « {search} ».</p></div>
        )}

        {filtered.length > 0 && (
          <div className="events-grid">
            {filtered.map((event, i) => (
              <EventCard key={event.id} event={event} style={{ animationDelay: `${i * 50}ms` }} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
