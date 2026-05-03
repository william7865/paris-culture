import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { fetchMapEvents } from '../api/events';

// Fix du bug Leaflet + Vite : les icônes de markers sont cassées sans ça
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const PARIS_CENTER = [48.8566, 2.3522];

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
};

export default function MapView({ q, category, dateFilter }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchMapEvents({ q, category, dateFilter })
      .then(data => { if (!cancelled) { setEvents(data.results ?? []); setLoading(false); } })
      .catch(err => { if (!cancelled) { setError(err.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [q, category, dateFilter, retryCount]);

  if (error) return (
    <div className="state-message state-message--error" style={{ minHeight: '500px' }}>
      <p>{error}</p>
      <button onClick={() => setRetryCount(c => c + 1)}>Réessayer</button>
    </div>
  );

  return (
    <div className="map-wrapper">
      {loading && <p className="map-loading">Chargement de la carte…</p>}
      <MapContainer
        center={PARIS_CENTER}
        zoom={12}
        className="map-container"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {events.map(event => (
          <Marker
            key={event.id}
            position={[event.lat_lon?.lat, event.lat_lon?.lon]}
          >
            <Popup className="event-popup">
              {event.cover_url && (
                <img
                  src={event.cover_url}
                  alt={event.title}
                  className="event-popup__img"
                />
              )}
              <div className="event-popup__body">
                {event.qfap_tags && (
                  <span className="event-popup__tag">
                    {event.qfap_tags.split(';')[0].trim()}
                  </span>
                )}
                <strong className="event-popup__title">{event.title}</strong>
                {event.date_start && (
                  <span className="event-popup__date">📅 {formatDate(event.date_start)}</span>
                )}
                {event.address_name && (
                  <span className="event-popup__address">📍 {event.address_name}</span>
                )}
                <Link
                  to={`/events/${event.id}`}
                  state={{ event }}
                  className="event-popup__link"
                >
                  Voir le détail →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
