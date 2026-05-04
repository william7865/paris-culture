const ARRONDISSEMENTS = Array.from({ length: 20 }, (_, i) => i + 1);
const ordinal = (n) => n === 1 ? '1er' : `${n}ème`;

export default function AdvancedFilters({ arrondissement, freeOnly, onArrondissementChange, onFreeOnlyChange }) {
  return (
    <div className="advanced-filters">
      <div className="advanced-filters__field">
        <label htmlFor="arr-select" className="advanced-filters__label">Arrondissement</label>
        <select
          id="arr-select"
          className="advanced-filters__select"
          value={arrondissement}
          onChange={e => onArrondissementChange(e.target.value)}
        >
          <option value="all">Tous les arrondissements</option>
          {ARRONDISSEMENTS.map(n => (
            <option key={n} value={String(n)}>{ordinal(n)} arrondissement</option>
          ))}
        </select>
      </div>

      <label className="advanced-filters__checkbox-label">
        <input
          type="checkbox"
          checked={freeOnly}
          onChange={e => onFreeOnlyChange(e.target.checked)}
        />
        Gratuit seulement
      </label>
    </div>
  );
}
