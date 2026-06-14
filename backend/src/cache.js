class MemoryCache {
  constructor() {
    this._store = new Map()
  }

  set(key, value, ttl) {
    this._store.set(key, { value, expires: Date.now() + ttl })
  }

  get(key) {
    const entry = this._store.get(key)
    if (!entry) return null
    if (Date.now() > entry.expires) {
      this._store.delete(key)
      return null
    }
    return entry.value
  }

  delete(key) {
    this._store.delete(key)
  }

  clear() {
    this._store.clear()
  }

  size() {
    return this._store.size
  }

  stats() {
    let valid = 0
    const now = Date.now()
    for (const entry of this._store.values()) {
      if (now <= entry.expires) valid++
    }
    return { total: this._store.size, valid }
  }
}

export const cache = new MemoryCache()
