import NewsCard from './NewsCard.jsx'

export default function NewsGrid({ news, total }) {
  if (!news.length) {
    return (
      <div className="empty-state">
        <span className="empty-icon">📭</span>
        <p className="empty-title">Nessuna notizia trovata</p>
        <p className="empty-sub">Prova a cambiare categoria o modifica la ricerca.</p>
      </div>
    )
  }

  return (
    <>
      {total != null && (
        <div className="stats-bar">
          <span className="stats-count">{total.toLocaleString('it-IT')}</span>
          <span> notizie trovate</span>
          {total !== news.length && (
            <>
              <span className="stats-sep">·</span>
              <span>visualizzate {news.length}</span>
            </>
          )}
        </div>
      )}

      <div className="news-grid" role="feed" aria-label="Feed notizie">
        {news.map((item, i) => (
          <NewsCard key={item.id} item={item} index={i} />
        ))}
      </div>
    </>
  )
}
