import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useEvents from '../hooks/useEvents';
import { useAuth } from '../context/AuthContext';
import SearchBar from '../components/SearchBar';
import CategoryFilter from '../components/CategoryFilter';
import EventCard from '../components/EventCard';
import Loader from '../components/Loader';
import AuthModal from '../components/AuthModal';

const LIMIT = 12;
const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ]               = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage]         = useState(1);
  const [showAuth, setShowAuth] = useState(false);

  const { data, loading, error } = useEvents(q, category, page);

  const handleSearch   = useCallback((v) => { setQ(v);        setPage(1); }, []);
  const handleCategory = useCallback((v) => { setCategory(v); setPage(1); }, []);

  const totalPages = data ? Math.ceil(data.total_count / LIMIT) : 0;
  const featured   = data?.results?.[0] ?? null;
  const rest       = data?.results?.slice(1) ?? [];

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <span className="site-header__wordmark">Paris <span>Culture</span></span>
          <div className="site-header__rule" />
          <span className="site-header__date">{today}</span>
          {user ? (
            <button className="header-btn" onClick={() => navigate('/favoris')}>♡ Favoris</button>
          ) : (
            <button className="header-btn" onClick={() => setShowAuth(true)}>Connexion</button>
          )}
        </div>
      </header>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      <main className="container">
        <div className="controls">
          <div className="controls__row">
            <SearchBar onSearch={handleSearch} />
            {!loading && !error && data && (
              <p className="results-count">
                <strong>{data.total_count.toLocaleString('fr-FR')}</strong> événements · page {page} / {totalPages}
              </p>
            )}
          </div>
          <CategoryFilter active={category} onChange={handleCategory} />
        </div>

        {loading && <Loader />}

        {error && (
          <div className="state-message state-message--error">
            <p>{error}</p>
            <button onClick={() => setPage(p => p)}>Réessayer</button>
          </div>
        )}

        {!loading && !error && data?.results?.length === 0 && (
          <div className="state-message"><p>Aucun événement trouvé.</p></div>
        )}

        {!loading && !error && data?.results?.length > 0 && (
          <>
            <div className="events-grid">
              {featured && <EventCard key={featured.id} event={featured} featured style={{ animationDelay: '0ms' }} />}
              {rest.map((event, i) => (
                <EventCard key={event.id} event={event} style={{ animationDelay: `${(i + 1) * 50}ms` }} />
              ))}
            </div>
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Précédent</button>
              <span>{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Suivant →</button>
            </div>
          </>
        )}
      </main>
    </>
  );
}
