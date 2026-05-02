const SKELETON_COUNT = 5;

export default function Loader() {
  return (
    <div className="events-grid">
      {Array.from({ length: SKELETON_COUNT }, (_, i) => (
        <div key={i} className={`skeleton-card${i === 0 ? ' event-card--featured' : ''}`}>
          <div className="skeleton skeleton--img" style={i === 0 ? { minHeight: 320 } : {}} />
          <div className="skeleton-card__body">
            <div className="skeleton skeleton--title" />
            <div className="skeleton skeleton--line" />
            <div className="skeleton skeleton--line skeleton--line-short" />
          </div>
        </div>
      ))}
    </div>
  );
}
