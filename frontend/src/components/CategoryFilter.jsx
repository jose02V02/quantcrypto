const CATEGORIES = ['Tutte', 'Italia', 'Mondo', 'Tech', 'Economia', 'Sport']

export default function CategoryFilter({ active, onSelect }) {
  return (
    <nav className="category-filter" aria-label="Filtra per categoria">
      {CATEGORIES.map(cat => (
        <button
          key={cat}
          className={`cat-btn ${active === cat ? 'active' : ''}`}
          onClick={() => onSelect(cat)}
          aria-pressed={active === cat}
        >
          {cat}
        </button>
      ))}
    </nav>
  )
}
