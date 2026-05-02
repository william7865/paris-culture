import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { fetchEvent } from '../api/events';
import { useAuth } from '../context/AuthContext';

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
};

export default function EventDetail() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user, isFavorite, toggleFavorite } = useAuth();

  const [event, setEvent]   = useState(state?.event ?? null);
  const [loading, setLoading] = useState(!state?.event);
  const [error, setError]   = useState(null);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    if (state?.event) return;
    fetchEvent(id)
      .then(data => { setEvent(data); setLoading(false); })
      .catch(err  => { setError(err.message); setLoading(false); });
  }, [id, state?.event]);

  const handleFavorite = async () => {
    if (!user) return navigate('/');
    setFavLoading(true);
    await toggleFavorite(event).catch(() => {});
    setFavLoading(false);
  };

  if (loading) return <div className="state-message" style={{ minHeight: '60vh' }}><p>Chargement…</p></div>;
  if (error)   return (
    <div className="state-message state-message--error" style={{ minHeight: '60vh' }}>
      <p>{error}</p>
      <button onClick={() => navigate(-1)}>← Retour</button>
    </div>
  );
  if (!event) return null;

  const tags     = event.qfap_tags?.split(';').map(t => t.trim()).filter(Boolean) ?? [];
  const favorited = isFavorite(event.id);

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <button className="back-btn" onClick={() => navigate(-1)}>← Retour</button>
          <div className="site-header__rule" />
          <span className="site-header__wordmark">Paris <span>Culture</span></span>
        </div>
      </header>

      <main className="container container--detail">
        {event.cover_url && (
          <div className="detail-hero">
            <img src={event.cover_url} alt={event.title} />
          </div>
        )}

        <div className="detail-top-row">
          <div className="detail-tags">
            {tags.map(tag => <span key={tag} className="detail-tag">{tag}</span>)}
            {event.price_type === 'gratuit' && <span className="detail-tag detail-tag--free">Gratuit</span>}
          </div>
          {user && (
            <button
              className={`fav-btn${favorited ? ' fav-btn--active' : ''}`}
              onClick={handleFavorite}
              disabled={favLoading}
              aria-label={favorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              {favorited ? '♥ Sauvegardé' : '♡ Sauvegarder'}
            </button>
          )}
        </div>

        <h1 className="detail-title">{event.title}</h1>

        <div className="detail-meta">
          {event.date_start && (
            <div className="detail-meta__item">
              <span className="detail-meta__label">Début</span>
              <span className="detail-meta__value">{formatDate(event.date_start)}</span>
            </div>
          )}
          {event.date_end && (
            <div className="detail-meta__item">
              <span className="detail-meta__label">Fin</span>
              <span className="detail-meta__value">{formatDate(event.date_end)}</span>
            </div>
          )}
          {event.address_name && (
            <div className="detail-meta__item">
              <span className="detail-meta__label">Lieu</span>
              <span className="detail-meta__value">
                {event.address_name}{event.address_zipcode ? `, ${event.address_zipcode}` : ''}
              </span>
            </div>
          )}
          {event.price_type && (
            <div className="detail-meta__item">
              <span className="detail-meta__label">Tarif</span>
              <span className="detail-meta__value" style={{ textTransform: 'capitalize' }}>{event.price_type}</span>
            </div>
          )}
        </div>

        {event.description && (
          <div className="detail-description" dangerouslySetInnerHTML={{ __html: event.description }} />
        )}

        {event.url && (
          <a href={event.url} target="_blank" rel="noopener noreferrer" className="detail-link">
            Voir sur paris.fr →
          </a>
        )}
      </main>
    </>
  );
}
