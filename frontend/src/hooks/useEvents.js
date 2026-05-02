import { useState, useEffect } from 'react';
import { fetchEvents } from '../api/events';

export default function useEvents(q, category, page, sort = 'date_asc', dateFilter = '') {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchEvents({ q, category, page, sort, dateFilter }, controller.signal)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err.message);
        setLoading(false);
      });

    return () => controller.abort();
  }, [q, category, page, sort, dateFilter]);

  return { data, loading, error };
}
