import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../utils/api.js'
import { useDebounce } from './useDebounce.js'

const REFRESH_INTERVAL = 60_000 // 60 s

export function useNews({ category, search }) {
  const [news, setNews]           = useState([])
  const [breaking, setBreaking]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [lastUpdated, setLast]    = useState(null)
  const [countdown, setCountdown] = useState(60)

  const debouncedSearch = useDebounce(search, 350)
  const intervalRef     = useRef(null)
  const countdownRef    = useRef(null)
  const mountedRef      = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const load = useCallback(async (showLoader = false) => {
    if (!mountedRef.current) return
    if (showLoader) setLoading(true)
    setError(null)

    try {
      const [newsRes, breakRes] = await Promise.all([
        api.news({ category, search: debouncedSearch }),
        api.breaking(),
      ])

      if (!mountedRef.current) return

      setNews(newsRes.news || [])
      setBreaking(breakRes.breaking || [])
      setLast(new Date())
      setCountdown(60)
    } catch (err) {
      if (!mountedRef.current) return
      setError(err.message || 'Errore di rete. Riprova.')
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [category, debouncedSearch])

  // Reload on filter change
  useEffect(() => {
    setNews([])
    load(true)

    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => load(false), REFRESH_INTERVAL)

    return () => clearInterval(intervalRef.current)
  }, [load])

  // Countdown timer — restarts when lastUpdated changes
  useEffect(() => {
    clearInterval(countdownRef.current)
    countdownRef.current = setInterval(() => {
      setCountdown(c => (c <= 1 ? 60 : c - 1))
    }, 1000)
    return () => clearInterval(countdownRef.current)
  }, [lastUpdated])

  const refresh = useCallback(() => {
    clearInterval(intervalRef.current)
    load(false)
    intervalRef.current = setInterval(() => load(false), REFRESH_INTERVAL)
  }, [load])

  return { news, breaking, loading, error, lastUpdated, countdown, refresh }
}
