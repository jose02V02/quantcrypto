const SKELETON_COUNT = 9

export default function Loader() {
  return (
    <div>
      <div className="stats-bar">
        <div style={{ width: 120, height: 14, background: 'var(--border)', borderRadius: 4 }} />
      </div>
      <div className="skeleton-grid">
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <div
            key={i}
            className="skeleton-card"
            style={{
              height: i % 3 === 0 ? 220 : 180,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
