export function timeAgo(dateStr) {
  try {
    const date = new Date(dateStr)
    const diff = Math.floor((Date.now() - date.getTime()) / 1000)

    if (diff < 30)   return 'adesso'
    if (diff < 90)   return `${diff}s fa`
    if (diff < 3600) return `${Math.floor(diff / 60)}m fa`
    if (diff < 86400)return `${Math.floor(diff / 3600)}h fa`

    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export const CATEGORY_COLORS = {
  Italia:   'var(--cat-italia)',
  Mondo:    'var(--cat-mondo)',
  Tech:     'var(--cat-tech)',
  Economia: 'var(--cat-economia)',
  Sport:    'var(--cat-sport)',
  Cultura:  'var(--cat-cultura)',
}

export function formatTime(date) {
  if (!date) return ''
  return new Date(date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
