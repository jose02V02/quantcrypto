import Parser from 'rss-parser'
import {
  FEEDS, CACHE_TTL, MAX_PER_FEED, BREAKING_MAX_AGE,
  FEED_TIMEOUT_MS, BREAKING_KEYWORDS,
} from './feeds.config.js'
import { cache } from './cache.js'

const parser = new Parser({
  timeout: FEED_TIMEOUT_MS,
  headers: { 'User-Agent': 'UltimaOra-Live/1.0 (+https://ultimaora.live)' },
  customFields: {
    item: ['media:content', 'media:thumbnail', 'enclosure'],
  },
})

// ─── helpers ────────────────────────────────────────────────────────────────

function stripHtml(str = '') {
  return str.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

function makeId(feedId, link) {
  const raw = feedId + (link || Math.random().toString())
  let hash = 0
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i)
    hash |= 0
  }
  return `${feedId}-${Math.abs(hash).toString(36)}`
}

function detectBreaking(title = '', categories = []) {
  const lower = title.toLowerCase()
  const catStr = categories.join(' ').toLowerCase()
  return BREAKING_KEYWORDS.some(kw => lower.includes(kw) || catStr.includes(kw))
}

function extractImage(item) {
  return (
    item['media:content']?.['$']?.url ||
    item['media:thumbnail']?.['$']?.url ||
    item.enclosure?.url ||
    null
  )
}

function normalizeItem(item, feed) {
  const rawExcerpt = item.contentSnippet || item.summary || item.content || ''
  const excerpt = stripHtml(rawExcerpt).substring(0, 200).trim()
  const cleanExcerpt = excerpt.length === 200 ? excerpt + '…' : excerpt

  const pubDate = item.pubDate || item.isoDate
  let publishedAt
  try {
    publishedAt = pubDate ? new Date(pubDate).toISOString() : new Date().toISOString()
  } catch {
    publishedAt = new Date().toISOString()
  }

  return {
    id: makeId(feed.id, item.link),
    title: stripHtml(item.title || '').trim(),
    excerpt: cleanExcerpt,
    url: item.link || '#',
    source: feed.name,
    category: feed.category,
    publishedAt,
    isBreaking: detectBreaking(item.title, item.categories || []),
    image: extractImage(item),
  }
}

// ─── single feed ────────────────────────────────────────────────────────────

async function fetchFeed(feed) {
  const cacheKey = `feed:${feed.id}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  try {
    const result = await parser.parseURL(feed.url)
    const items = result.items
      .slice(0, MAX_PER_FEED)
      .map(item => normalizeItem(item, feed))
      .filter(item => item.title && item.url !== '#')

    cache.set(cacheKey, items, CACHE_TTL)
    return items
  } catch (err) {
    console.warn(`[feed] ${feed.name} failed: ${err.message}`)
    return []
  }
}

// ─── public API ─────────────────────────────────────────────────────────────

export async function fetchAllFeeds(forceRefresh = false) {
  const cacheKey = 'all:news'

  if (forceRefresh) {
    cache.clear()
  } else {
    const cached = cache.get(cacheKey)
    if (cached) return cached
  }

  const settled = await Promise.allSettled(FEEDS.map(fetchFeed))

  const allItems = settled
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value)

  // deduplicate by URL
  const seen = new Set()
  const unique = allItems.filter(item => {
    if (seen.has(item.url)) return false
    seen.add(item.url)
    return true
  })

  unique.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))

  cache.set(cacheKey, unique, CACHE_TTL)
  return unique
}

export async function fetchBreakingNews() {
  const all = await fetchAllFeeds()
  const cutoff = Date.now() - BREAKING_MAX_AGE

  return all
    .filter(item => {
      const age = new Date(item.publishedAt).getTime()
      return item.isBreaking && age > cutoff
    })
    .slice(0, 12)
}

export function getCacheStats() {
  return cache.stats()
}
