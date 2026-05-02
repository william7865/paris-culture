import { useState, useEffect, useRef, useCallback } from 'react';

const DEBOUNCE_MS = 400;

export default function SearchBar({ onSearch }) {
  const [value, setValue] = useState('');
  const timerRef = useRef(null);

  const flush = useCallback((q) => {
    clearTimeout(timerRef.current);
    onSearch(q);
  }, [onSearch]);

  useEffect(() => {
    timerRef.current = setTimeout(() => onSearch(value), DEBOUNCE_MS);
    return () => clearTimeout(timerRef.current);
  }, [value, onSearch]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') flush(value);
  };

  const handleClear = () => {
    setValue('');
    flush('');
  };

  return (
    <div className="search-bar">
      <input
        type="search"
        className="search-bar__input"
        placeholder="Rechercher un événement…"
        aria-label="Rechercher un événement"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {value && (
        <button className="search-bar__clear" onClick={handleClear} aria-label="Effacer la recherche">
          ×
        </button>
      )}
    </div>
  );
}
