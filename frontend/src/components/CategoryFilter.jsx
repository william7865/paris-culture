const CATEGORIES = [
  { label: 'Tous',        value: 'all' },
  { label: 'Concerts',    value: 'Concert' },
  { label: 'Expositions', value: 'Expo' },
  { label: 'Festivals',   value: 'Festival' },
  { label: 'Cinéma',      value: 'Ecrans' },
  { label: 'Sports',      value: 'Sport' },
  { label: 'Théâtre',     value: 'Théâtre' },
  { label: 'Enfants',     value: 'Enfants' },
];

export default function CategoryFilter({ active, onChange }) {
  return (
    <div className="category-filter" role="group" aria-label="Filtrer par catégorie">
      {CATEGORIES.map(({ label, value }) => (
        <button
          key={value}
          className={`category-filter__btn${active === value ? ' category-filter__btn--active' : ''}`}
          aria-pressed={active === value}
          onClick={() => onChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
