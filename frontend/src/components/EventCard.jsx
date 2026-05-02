import { memo } from 'react';
import { Link } from 'react-router-dom';

const CATEGORY_COLORS = {
  concerts:    '#e05252',
  expositions: '#5b8dee',
  spectacles:  '#9b59b6',
  cinéma:      '#e67e22',
  sports:      '#27ae60',
  théâtre:     '#c0392b',
  jeunesse:    '#f39c12',
};

const getCategoryColor = (tags) => {
  if (!tags) return '#666';
  const lower = tags.toLowerCase();
  for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return '#666';
};

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

const EventCard = memo(function EventCard({ event }) {
  const color = getCategoryColor(event.qfap_tags);
  const firstTag = event.qfap_tags?.split(';')[0] ?? '';

  return (
    <Link to={`/events/${event.id}`} state={{ event }} className="event-card">
      <div className="event-card__img-wrap">
        {event.cover_url
          ? <img src={event.cover_url} alt={event.title} loading="lazy" className="event-card__img" />
          : <div className="event-card__img-fallback">🗼</div>
        }
        {firstTag && (
          <span className="event-card__badge" style={{ background: color }}>{firstTag}</span>
        )}
        {event.price_type === 'gratuit' && (
          <span className="event-card__badge event-card__badge--free">Gratuit</span>
        )}
      </div>
      <div className="event-card__body">
        <h2 className="event-card__title">{event.title}</h2>
        {event.lead_text && <p className="event-card__desc">{event.lead_text}</p>}
        <div className="event-card__meta">
          {event.date_start && <span>{formatDate(event.date_start)}</span>}
          {event.address_name && <span>{event.address_name}</span>}
        </div>
      </div>
    </Link>
  );
});

export default EventCard;
