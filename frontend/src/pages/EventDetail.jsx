import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { fetchEvent } from '../api/events';

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

  const [event, setEvent] = useState(state?.event ?? null);
  const [loading, setLoading] = useState(!state?.event);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (state?.event) return;
    fetchEvent(id)
      .then((data) => { setEvent(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [id, state?.event]);

  if (loading) return <div className="state-message"><p>Chargement…</p></div>;

  if (error) return (
    <div className="state-message state-message--error">
      <p>{error}</p>
      <button onClick={() => navigate(-1)}>← Retour</button>
    </div>
  );

  if (!event) return null;

  const tags = event.qfap_tags?.split(';').filter(Boolean) ?? [];

  return (
    <>
      <header className="site-header">
        <button className="back-btn" onClick={() => navigate(-1)}>← Retour</button>
        <span className="site-header__logo">🗼 Paris Culture</span>
      </header>

      <main className="container container--detail">
        {event.cover_url && (
          <img src={event.cover_url} alt={event.title} className="detail-cover" />
        )}

        <div className="detail-tags">
          {tags.map((tag) => (
            <span key={tag} className="detail-tag">{tag}</span>
          ))}
          {event.price_type === 'gratuit' && (
            <span className="detail-tag detail-tag--free">Gratuit</span>
          )}
        </div>

        <h1 className="detail-title">{event.title}</h1>

        <div className="detail-meta">
          {event.date_start && <p>Du <strong>{formatDate(event.date_start)}</strong></p>}
          {event.date_end && <p>au <strong>{formatDate(event.date_end)}</strong></p>}
          {event.address_name && <p>📍 {event.address_name}{event.address_zipcode ? `, ${event.address_zipcode}` : ''}</p>}
        </div>

        {event.description && (
          <div
            className="detail-description"
            dangerouslySetInnerHTML={{ __html: event.description }}
          />
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
