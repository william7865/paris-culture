const SKELETON_COUNT = 6;

export default function Loader() {
  return (
    <div className="events-grid">
      {Array.from({ length: SKELETON_COUNT }, (_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton skeleton--img" />
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
