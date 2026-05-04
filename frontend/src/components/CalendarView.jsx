import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchCalendarEvents } from '../api/events';

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                   'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

function toISO(date) {
  return date.toISOString().split('T')[0];
}

function groupByDay(events) {
  const map = new Map();
  for (const event of events) {
    const start = event.date_start ? event.date_start.split('T')[0] : null;
    const end   = event.date_end   ? event.date_end.split('T')[0]   : start;
    if (!start) continue;
    let cur = new Date(start);
    const endDate = new Date(end);
    while (cur <= endDate) {
      const key = toISO(cur);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(event);
      cur.setDate(cur.getDate() + 1);
    }
  }
  return map;
}

function buildGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < startOffset; i++) {
    const d = new Date(year, month, 1 - (startOffset - i));
    cells.push({ date: toISO(d), currentMonth: false });
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push({ date: toISO(new Date(year, month, d)), currentMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const d = new Date(year, month + 1, cells.length - lastDay.getDate() - startOffset + 1);
    cells.push({ date: toISO(d), currentMonth: false });
  }
  return cells;
}

export default function CalendarView({ q, category, arrondissement = 'all', freeOnly = false }) {
  const now = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSelectedDay(null);

    const dateFrom = toISO(new Date(year, month, 1));
    const dateTo   = toISO(new Date(year, month + 1, 0));

    fetchCalendarEvents({ q, category, arrondissement, freeOnly, dateFrom, dateTo })
      .then(data => {
        if (!cancelled) {
          setEvents(data.results ?? []);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [year, month, q, category, arrondissement, freeOnly]);

  const eventsByDay = groupByDay(events);
  const cells = buildGrid(year, month);
  const todayISO = toISO(new Date());

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const selectedEvents = selectedDay ? (eventsByDay.get(selectedDay) ?? []) : [];

  return (
    <div className="calendar">
      <div className="calendar__header">
        <button className="calendar__nav-btn" onClick={prevMonth} aria-label="Mois précédent">◀</button>
        <h2 className="calendar__title">{MONTHS_FR[month]} {year}</h2>
        <button className="calendar__nav-btn" onClick={nextMonth} aria-label="Mois suivant">▶</button>
      </div>

      {loading && <div className="calendar__loading">Chargement…</div>}
      {error && <div className="state-message state-message--error"><p>{error}</p></div>}

      {!loading && !error && (
        <>
          <div className="calendar__grid">
            {DAYS_FR.map(d => (
              <div key={d} className="calendar__day-header">{d}</div>
            ))}
            {cells.map(cell => {
              const count = eventsByDay.get(cell.date)?.length ?? 0;
              const isSelected = cell.date === selectedDay;
              const isToday = cell.date === todayISO;
              return (
                <div
                  key={cell.date}
                  className={[
                    'calendar__day',
                    !cell.currentMonth ? 'calendar__day--other-month' : '',
                    count > 0 ? 'calendar__day--has-events' : '',
                    isSelected ? 'calendar__day--selected' : '',
                    isToday ? 'calendar__day--today' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => count > 0 && setSelectedDay(isSelected ? null : cell.date)}
                >
                  <span className="calendar__day-num">{parseInt(cell.date.split('-')[2], 10)}</span>
                  {count > 0 && (
                    <span className="calendar__count">{count}</span>
                  )}
                </div>
              );
            })}
          </div>

          {selectedDay && selectedEvents.length > 0 && (
            <div className="calendar__events">
              <h3 className="calendar__events-title">
                {new Date(selectedDay + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <ul className="calendar__events-list">
                {selectedEvents.map(event => (
                  <li key={event.id} className="calendar__event-item">
                    <Link to={`/events/${event.url_name ?? event.id}`} className="calendar__event-link">
                      <span className="calendar__event-title">{event.title}</span>
                      <span className="calendar__event-meta">{event.address_name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
