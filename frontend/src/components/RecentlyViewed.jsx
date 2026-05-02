import EventCard from './EventCard';

const KEY = 'paris_culture_recent';

export const saveRecent = (event) => {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || '[]');
    const updated = [event, ...stored.filter(e => e.id !== event.id)].slice(0, 5);
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {}
};

export const getRecent = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
};

export default function RecentlyViewed() {
  const events = getRecent();
  if (!events.length) return null;

  return (
    <section className="recently-viewed">
      <h2 className="recently-viewed__title">Récemment consultés</h2>
      <div className="recently-viewed__grid">
        {events.map((event, i) => (
          <EventCard key={event.id} event={event} style={{ animationDelay: `${i * 50}ms` }} />
        ))}
      </div>
    </section>
  );
}
