const BASE = import.meta.env.VITE_API_URL || ''

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  news: ({ category, search, page = 1, limit = 40 } = {}) => {
    const p = new URLSearchParams({ page, limit })
    if (category && category !== 'Tutte') p.set('category', category)
    if (search?.trim()) p.set('search', search.trim())
    return request(`/api/news?${p}`)
  },

  breaking: () => request('/api/news/breaking'),

  refresh: () => request('/api/refresh', { method: 'POST' }),

  health: () => request('/api/health'),
}
