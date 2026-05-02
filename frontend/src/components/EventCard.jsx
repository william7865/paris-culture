import { memo } from 'react';
import { Link } from 'react-router-dom';

const CATEGORY_COLORS = {
  concert:  '#c8923a',
  expo:     '#5b8dee',
  festival: '#9b59b6',
  ecrans:   '#e67e22',
  sport:    '#27ae60',
  théâtre:  '#c0392b',
  enfants:  '#f39c12',
};

const getCategoryColor = (tags) => {
  if (!tags) return '#555';
  const lower = tags.toLowerCase();
  for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return '#555';
};

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

const EventCard = memo(function EventCard({ event, featured, style }) {
  const color = getCategoryColor(event.qfap_tags);
  const firstTag = event.qfap_tags?.split(';')[0]?.trim() ?? '';

  return (
    <Link
      to={`/events/${event.id}`}
      state={{ event }}
      className={`event-card${featured ? ' event-card--featured' : ''}`}
      style={style}
    >
      <div className="event-card__img-wrap">
        {event.cover_url
          ? <img src={event.cover_url} alt={event.title} loading="lazy" className="event-card__img" />
          : <div className="event-card__img-fallback">🗼</div>
        }
        <div className="event-card__cat-bar" style={{ background: color }} />
        {event.price_type === 'gratuit' && (
          <span className="event-card__free-badge">Gratuit</span>
        )}
      </div>

      <div className="event-card__body">
        {firstTag && (
          <div className="event-card__category">
            <span className="event-card__category-dot" style={{ background: color }} />
            {firstTag}
          </div>
        )}
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
