const CATEGORIES = [
  { label: 'Tous',        value: 'all' },
  { label: 'Concerts',    value: 'concerts' },
  { label: 'Expositions', value: 'expositions' },
  { label: 'Spectacles',  value: 'spectacles' },
  { label: 'Cinéma',      value: 'cinéma' },
  { label: 'Sports',      value: 'sports' },
  { label: 'Théâtre',     value: 'théâtre' },
  { label: 'Jeunesse',    value: 'jeunesse' },
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
