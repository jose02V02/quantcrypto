export const FEEDS = [
  // ── Italia ──────────────────────────────────────────────────────
  {
    id: 'ansa',
    name: 'ANSA',
    url: 'https://www.ansa.it/sito/notizie/topnews/topnews_rss.xml',
    category: 'Italia',
  },
  {
    id: 'repubblica',
    name: 'Repubblica',
    url: 'https://www.repubblica.it/rss/homepage/rss2.0.xml',
    category: 'Italia',
  },
  {
    id: 'corriere',
    name: 'Corriere della Sera',
    url: 'https://www.corriere.it/rss/homepage.xml',
    category: 'Italia',
  },
  {
    id: 'tgcom24',
    name: 'TGCom24',
    url: 'https://www.tgcom24.mediaset.it/rss/cronaca.xml',
    category: 'Italia',
  },

  // ── Mondo ────────────────────────────────────────────────────────
  {
    id: 'bbc-world',
    name: 'BBC World',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    category: 'Mondo',
  },
  {
    id: 'reuters',
    name: 'Reuters',
    url: 'https://feeds.reuters.com/reuters/topNews',
    category: 'Mondo',
  },
  {
    id: 'ap-news',
    name: 'AP News',
    url: 'https://rsshub.app/apnews/topics/apf-topnews',
    category: 'Mondo',
  },

  // ── Tech ─────────────────────────────────────────────────────────
  {
    id: 'techcrunch',
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    category: 'Tech',
  },
  {
    id: 'theverge',
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    category: 'Tech',
  },
  {
    id: 'hackernews',
    name: 'Hacker News',
    url: 'https://hnrss.org/frontpage',
    category: 'Tech',
  },
  {
    id: 'wired',
    name: 'Wired',
    url: 'https://www.wired.com/feed/rss',
    category: 'Tech',
  },

  // ── Economia ─────────────────────────────────────────────────────
  {
    id: 'sole24ore',
    name: 'Il Sole 24 Ore',
    url: 'https://www.ilsole24ore.com/rss/italia--mondo.xml',
    category: 'Economia',
  },
  {
    id: 'bloomberg',
    name: 'Bloomberg Markets',
    url: 'https://feeds.bloomberg.com/markets/news.rss',
    category: 'Economia',
  },

  // ── Sport ─────────────────────────────────────────────────────────
  {
    id: 'gazzetta',
    name: 'Gazzetta dello Sport',
    url: 'https://www.gazzetta.it/rss/home.xml',
    category: 'Sport',
  },
  {
    id: 'sky-sport',
    name: 'Sky Sport',
    url: 'https://sport.sky.it/rss/calcio.xml',
    category: 'Sport',
  },
]

export const CATEGORIES = ['Tutte', 'Italia', 'Mondo', 'Tech', 'Economia', 'Sport']

export const CACHE_TTL        = 5 * 60 * 1000   // 5 min
export const MAX_PER_FEED     = 20
export const BREAKING_MAX_AGE = 2 * 60 * 60 * 1000  // 2 h
export const FEED_TIMEOUT_MS  = 12_000

export const BREAKING_KEYWORDS = [
  'breaking', 'urgente', 'flash', 'ultim',
  'allarme', 'emergenza', 'attentato', 'terremoto',
  'esplosione', 'incidente grave', 'crisi', 'dimissioni',
  'guerra', 'morto', 'morte', 'ucciso', 'uccisa',
  'disastro', 'crollo',
]
