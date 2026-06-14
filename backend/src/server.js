import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { fetchAllFeeds, fetchBreakingNews, getCacheStats } from './feedService.js'
import { CATEGORIES } from './feeds.config.js'

const app  = express()
const PORT = process.env.PORT || 3001

const ALLOWED = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED.length === 0 || ALLOWED.includes(origin)) {
      cb(null, true)
    } else {
      cb(new Error('CORS: origin not allowed'))
    }
  },
  methods: ['GET', 'POST'],
}))

app.use(express.json())

// ─── routes ─────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), cache: getCacheStats() })
})

app.get('/api/categories', (_req, res) => {
  res.json({ categories: CATEGORIES })
})

app.get('/api/news', async (req, res) => {
  try {
    const { category, search, page = '1', limit = '30' } = req.query
    let items = await fetchAllFeeds()

    if (category && category !== 'Tutte') {
      items = items.filter(n => n.category === category)
    }

    if (search?.trim()) {
      const q = search.toLowerCase()
      items = items.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.excerpt.toLowerCase().includes(q) ||
        n.source.toLowerCase().includes(q)
      )
    }

    const pageNum  = Math.max(1, parseInt(page, 10))
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10)))
    const offset   = (pageNum - 1) * pageSize
    const slice    = items.slice(offset, offset + pageSize)

    res.json({
      news:    slice,
      total:   items.length,
      page:    pageNum,
      hasMore: offset + pageSize < items.length,
    })
  } catch (err) {
    console.error('[/api/news]', err.message)
    res.status(500).json({ error: 'Errore nel recupero delle notizie.' })
  }
})

app.get('/api/news/breaking', async (_req, res) => {
  try {
    const breaking = await fetchBreakingNews()
    res.json({ breaking })
  } catch (err) {
    console.error('[/api/news/breaking]', err.message)
    res.status(500).json({ error: 'Errore nel recupero delle breaking news.' })
  }
})

app.post('/api/refresh', async (_req, res) => {
  try {
    await fetchAllFeeds(true)
    res.json({ success: true, timestamp: new Date().toISOString() })
  } catch (err) {
    console.error('[/api/refresh]', err.message)
    res.status(500).json({ error: 'Errore durante il refresh.' })
  }
})

// ─── 404 fallthrough ────────────────────────────────────────────────────────

app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

// ─── start ──────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🔴 UltimaOra Live backend  →  http://localhost:${PORT}\n`)
})
