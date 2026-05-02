import { useState, useCallback } from 'react';
import useEvents from '../hooks/useEvents';
import SearchBar from '../components/SearchBar';
import CategoryFilter from '../components/CategoryFilter';
import EventCard from '../components/EventCard';
import Loader from '../components/Loader';

const LIMIT = 12;

export default function Home() {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);

  const { data, loading, error } = useEvents(q, category, page);

  const handleSearch = useCallback((value) => {
    setQ(value);
    setPage(1);
  }, []);

  const handleCategory = useCallback((value) => {
    setCategory(value);
    setPage(1);
  }, []);

  const totalPages = data ? Math.ceil(data.total_count / LIMIT) : 0;

  return (
    <>
      <header className="site-header">
        <span className="site-header__logo">🗼 Paris Culture</span>
      </header>

      <main className="container">
        <div className="controls">
          <SearchBar onSearch={handleSearch} />
          <CategoryFilter active={category} onChange={handleCategory} />
        </div>

        {!loading && !error && data && (
          <p className="results-count">{data.total_count} événement{data.total_count > 1 ? 's' : ''} trouvé{data.total_count > 1 ? 's' : ''}</p>
        )}

        {loading && <Loader />}

        {error && (
          <div className="state-message state-message--error">
            <p>{error}</p>
            <button onClick={() => setPage((p) => p)}>Réessayer</button>
          </div>
        )}

        {!loading && !error && data?.results?.length === 0 && (
          <div className="state-message">
            <p>Aucun événement trouvé.</p>
          </div>
        )}

        {!loading && !error && data?.results?.length > 0 && (
          <>
            <div className="events-grid">
              {data.results.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>

            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Précédent</button>
              <span>Page {page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Suivant →</button>
            </div>
          </>
        )}
      </main>
    </>
  );
}
