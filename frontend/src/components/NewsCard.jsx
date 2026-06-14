import { memo } from 'react'
import { timeAgo, CATEGORY_COLORS } from '../utils/helpers.js'

const NewsCard = memo(function NewsCard({ item, index }) {
  const color = CATEGORY_COLORS[item.category] || 'var(--text-3)'

  return (
    <article
      className={`news-card ${item.isBreaking ? 'breaking' : ''}`}
      style={{
        animationDelay: `${Math.min(index * 0.04, 0.6)}s`,
        '--cat-color': color,
      }}
    >
      {/* Breaking badge */}
      {item.isBreaking && (
        <span className="breaking-badge">🔴 BREAKING</span>
      )}

      {/* Optional image */}
      {item.image && (
        <img
          src={item.image}
          alt=""
          className="card-image"
          loading="lazy"
          onError={e => { e.currentTarget.style.display = 'none' }}
        />
      )}

      {/* Meta row */}
      <div className="card-meta">
        <span
          className="cat-tag"
          style={{ '--tag-color': color }}
        >
          {item.category}
        </span>
        <time className="card-time" dateTime={item.publishedAt}>
          {timeAgo(item.publishedAt)}
        </time>
      </div>

      {/* Title */}
      <h2 className="card-title">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {item.title}
        </a>
      </h2>

      {/* Excerpt */}
      {item.excerpt && (
        <p className="card-excerpt">{item.excerpt}</p>
      )}

      {/* Footer */}
      <div className="card-footer">
        <span className="card-source">
          <span
            className="source-dot"
            style={{ '--dot-color': color }}
          />
          {item.source}
        </span>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="card-link"
          aria-label={`Leggi su ${item.source}`}
        >
          Leggi →
        </a>
      </div>
    </article>
  )
})

export default NewsCard
