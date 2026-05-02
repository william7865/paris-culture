const FILTERS = [
  { label: 'Toutes dates', value: '' },
  { label: 'Ce soir',      value: 'today' },
  { label: 'Ce weekend',   value: 'weekend' },
  { label: 'Cette semaine', value: 'week' },
];

export default function QuickDateFilter({ active, onChange }) {
  return (
    <div className="quick-date-filter">
      {FILTERS.map(({ label, value }) => (
        <button
          key={value}
          className={`quick-date-filter__btn${active === value ? ' quick-date-filter__btn--active' : ''}`}
          onClick={() => onChange(value)}
          aria-pressed={active === value}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
