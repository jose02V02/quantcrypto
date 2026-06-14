export default function BreakingNewsTicker({ items }) {
  if (!items.length) return null

  // Duplicate for seamless loop
  const doubled = [...items, ...items]

  return (
    <div className="breaking-ticker" role="marquee" aria-label="Breaking news">
      <span className="ticker-label">
        <span className="ticker-label-dot" />
        BREAKING
      </span>

      <div className="ticker-track">
        <div className="ticker-inner">
          {doubled.map((item, i) => (
            <span key={`${item.id}-${i}`} className="ticker-item">
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                {item.title}
              </a>
              <span className="ticker-sep" aria-hidden="true">•</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
