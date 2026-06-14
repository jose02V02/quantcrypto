import { useState } from 'react'
import { formatTime } from '../utils/helpers.js'

const CIRCUMFERENCE = 2 * Math.PI * 12 // r=12

export default function Header({ lastUpdated, countdown, onRefresh }) {
  const [spinning, setSpinning] = useState(false)

  async function handleRefresh() {
    setSpinning(true)
    await onRefresh()
    setTimeout(() => setSpinning(false), 800)
  }

  const progress = countdown / 60
  const dashOffset = CIRCUMFERENCE * (1 - progress)

  return (
    <header className="header">
      <div className="header-inner">
        {/* Logo */}
        <div className="logo">
          <span className="logo-text">Ultima<span>Ora</span> Live</span>
          <span className="live-badge">
            <span className="live-dot" />
            LIVE
          </span>
        </div>

        <div className="header-spacer" />

        {/* Meta info */}
        <div className="header-meta">
          {lastUpdated && (
            <span className="last-updated">
              Aggiornato {formatTime(lastUpdated)}
            </span>
          )}

          {/* Countdown ring */}
          <div className="countdown-ring" title={`Prossimo aggiornamento in ${countdown}s`}>
            <svg viewBox="0 0 30 30" width="30" height="30">
              <circle className="track" cx="15" cy="15" r="12" />
              <circle
                className="fill"
                cx="15" cy="15" r="12"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
              />
            </svg>
            <span className="countdown-number">{countdown}</span>
          </div>

          <button
            className={`btn-refresh ${spinning ? 'spinning' : ''}`}
            onClick={handleRefresh}
            disabled={spinning}
            title="Aggiorna ora"
          >
            <span className="btn-icon">↻</span>
            Aggiorna
          </button>
        </div>
      </div>
    </header>
  )
}
