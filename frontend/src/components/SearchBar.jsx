export default function SearchBar({ value, onChange }) {
  return (
    <div className="search-wrap">
      <span className="search-icon" aria-hidden="true">⌕</span>
      <input
        type="search"
        className="search-input"
        placeholder="Cerca notizie…"
        value={value}
        onChange={e => onChange(e.target.value)}
        aria-label="Cerca notizie"
      />
      {value && (
        <button
          className="search-clear"
          onClick={() => onChange('')}
          aria-label="Cancella ricerca"
        >
          ×
        </button>
      )}
    </div>
  )
}
