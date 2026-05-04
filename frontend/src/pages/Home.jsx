import { useState, useCallback } from 'react';
import useEvents from '../hooks/useEvents';
import usePageTitle from '../hooks/usePageTitle';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SearchBar from '../components/SearchBar';
import CategoryFilter from '../components/CategoryFilter';
import QuickDateFilter from '../components/QuickDateFilter';
import RecentlyViewed from '../components/RecentlyViewed';
import EventCard from '../components/EventCard';
import Loader from '../components/Loader';
import MapView from '../components/MapView';
import CalendarView from '../components/CalendarView';
import AdvancedFilters from '../components/AdvancedFilters';

const LIMIT = 12;

export default function Home() {
  usePageTitle('Agenda culturel parisien');
  const [q, setQ]               = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort]         = useState('date_asc');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage]         = useState(1);
  const [view, setView]         = useState('list');
  const [arrondissement, setArrondissement]   = useState('all');
  const [freeOnly, setFreeOnly]               = useState(false);
  const [showAdvanced, setShowAdvanced]       = useState(false);

  const { data, loading, error } = useEvents(q, category, page, sort, dateFilter, arrondissement, freeOnly);

  const handleSearch     = useCallback((v) => { setQ(v);          setPage(1); }, []);
  const handleCategory   = useCallback((v) => { setCategory(v);   setPage(1); }, []);
  const handleSort       = useCallback((v) => { setSort(v);       setPage(1); }, []);
  const handleDateFilter = useCallback((v) => { setDateFilter(v); setPage(1); }, []);
  const handleView       = useCallback((v) => setView(v), []);
  const handleArrondissement = useCallback((v) => { setArrondissement(v); setPage(1); }, []);
  const handleFreeOnly       = useCallback((v) => { setFreeOnly(v);       setPage(1); }, []);

  const advancedCount = (arrondissement !== 'all' ? 1 : 0) + (freeOnly ? 1 : 0);

  const totalPages = data ? Math.ceil(data.total_count / LIMIT) : 0;
  const featured   = data?.results?.[0] ?? null;
  const rest       = data?.results?.slice(1) ?? [];

  return (
    <>
      <Header />

      <main className="container">
        <div className="controls">
          <div className="controls__row">
            <SearchBar onSearch={handleSearch} />
            {!loading && !error && data && (
              <p className="results-count">
                <strong>{data.total_count.toLocaleString('fr-FR')}</strong> événements · page {page} / {totalPages}
              </p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <button
                className={`advanced-filters-toggle${showAdvanced ? ' advanced-filters-toggle--active' : ''}`}
                onClick={() => setShowAdvanced(v => !v)}
                aria-expanded={showAdvanced}
              >
                Filtres{advancedCount > 0 ? ` (${advancedCount})` : ''}
              </button>
              <div className="view-toggle" role="group" aria-label="Mode d'affichage">
                <button
                  className={`view-toggle__btn${view === 'list' ? ' view-toggle__btn--active' : ''}`}
                  aria-pressed={view === 'list'}
                  onClick={() => handleView('list')}
                >
                  ☰ Liste
                </button>
                <button
                  className={`view-toggle__btn${view === 'map' ? ' view-toggle__btn--active' : ''}`}
                  aria-pressed={view === 'map'}
                  onClick={() => handleView('map')}
                >
                  🗺 Carte
                </button>
                <button
                  className={`view-toggle__btn${view === 'calendar' ? ' view-toggle__btn--active' : ''}`}
                  aria-pressed={view === 'calendar'}
                  onClick={() => handleView('calendar')}
                >
                  📅 Calendrier
                </button>
              </div>
            </div>
          </div>
          {view !== 'calendar' && (
            <QuickDateFilter active={dateFilter} onChange={handleDateFilter} />
          )}
          {showAdvanced && (
            <AdvancedFilters
              arrondissement={arrondissement}
              freeOnly={freeOnly}
              onArrondissementChange={handleArrondissement}
              onFreeOnlyChange={handleFreeOnly}
            />
          )}
          <div className="controls__bottom">
            <CategoryFilter active={category} onChange={handleCategory} />
            <select className="sort-select" value={sort} onChange={e => handleSort(e.target.value)} aria-label="Trier les événements">
              <option value="date_asc">Date croissante</option>
              <option value="date_desc">Date décroissante</option>
              <option value="free_first">Gratuit en premier</option>
            </select>
          </div>
        </div>

        {view === 'list' && loading && <Loader />}

        {error && (
          <div className="state-message state-message--error">
            <p>{error}</p>
            <button onClick={() => setPage(p => p)}>Réessayer</button>
          </div>
        )}

        {view === 'list' && !loading && !error && data?.results?.length === 0 && (
          <div className="state-message"><p>Aucun événement trouvé.</p></div>
        )}

        {view === 'map' && (
          <MapView q={q} category={category} dateFilter={dateFilter} arrondissement={arrondissement} freeOnly={freeOnly} />
        )}

        {view === 'calendar' && (
          <CalendarView
            q={q}
            category={category}
            arrondissement={arrondissement}
            freeOnly={freeOnly}
          />
        )}

        {view === 'list' && !loading && !error && data?.results?.length > 0 && (
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

      <div className="container" style={{ paddingTop: 0 }}>
        <RecentlyViewed />
      </div>
      <Footer />
    </>
  );
}
