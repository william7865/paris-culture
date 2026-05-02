import { useState, useEffect } from 'react';
import { fetchSimilarEvents } from '../api/events';
import EventCard from './EventCard';

export default function SimilarEvents({ tag, excludeId }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!tag) return;
    fetchSimilarEvents(tag, excludeId).then(setEvents).catch(() => {});
  }, [tag, excludeId]);

  if (!events.length) return null;

  return (
    <section className="similar-events">
      <h2 className="similar-events__title">Dans la même veine</h2>
      <div className="similar-events__grid">
        {events.map((event, i) => (
          <EventCard
            key={event.id}
            event={event}
            style={{ animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
    </section>
  );
}
