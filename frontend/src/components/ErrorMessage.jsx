export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="error-box" role="alert">
      <span className="error-icon">⚠️</span>
      <p className="error-title">Impossibile caricare le notizie</p>
      <p className="error-msg">{message}</p>
      {onRetry && (
        <button className="btn-retry" onClick={onRetry}>
          Riprova
        </button>
      )}
    </div>
  )
}
