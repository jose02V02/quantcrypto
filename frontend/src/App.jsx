import { useState } from 'react'
import Header            from './components/Header.jsx'
import BreakingNewsTicker from './components/BreakingNewsTicker.jsx'
import CategoryFilter    from './components/CategoryFilter.jsx'
import SearchBar         from './components/SearchBar.jsx'
import NewsGrid          from './components/NewsGrid.jsx'
import Loader            from './components/Loader.jsx'
import ErrorMessage      from './components/ErrorMessage.jsx'
import { useNews }       from './hooks/useNews.js'

export default function App() {
  const [category, setCategory] = useState('Tutte')
  const [search, setSearch]     = useState('')

  const { news, breaking, loading, error, lastUpdated, countdown, refresh } =
    useNews({ category, search })

  return (
    <div className="app">
      <Header
        lastUpdated={lastUpdated}
        countdown={countdown}
        onRefresh={refresh}
      />

      <BreakingNewsTicker items={breaking} />

      <main className="main">
        <div className="controls">
          <CategoryFilter active={category} onSelect={setCategory} />
          <SearchBar value={search} onChange={setSearch} />
        </div>

        {error && !loading && (
          <ErrorMessage message={error} onRetry={refresh} />
        )}

        {loading ? (
          <Loader />
        ) : (
          <NewsGrid news={news} total={news.length} />
        )}
      </main>

      <footer className="footer">
        <p>
          UltimaOra Live &copy; {new Date().getFullYear()} —{' '}
          Aggregatore di notizie pubbliche · Le notizie appartengono alle rispettive testate.{' '}
          <a href="https://github.com/jose02v02/quantcrypto" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </p>
      </footer>
    </div>
  )
}
