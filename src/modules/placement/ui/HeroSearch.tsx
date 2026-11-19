import { ArrowRight, ChevronDown, MapPin, Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { CITIES } from '../../housekeepers/domain/Housekeeper'
import type { SearchFilter } from '../domain/Search'

export function HeroSearch({ onSearch }: { onSearch: (filter: SearchFilter) => void }) {
  const [text, setText] = useState('')
  const [city, setCity] = useState<string>('Maputo')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSearch({ text: text || undefined, city: city || undefined })
  }

  return (
    <form className="hero-search" onSubmit={handleSubmit} role="search" aria-label="Pesquisar candidatas">
      <label className="hero-input">
        <Search size={20} />
        <input aria-label="O que procura?" placeholder="O que procura?" value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <label className="hero-select">
        <MapPin size={20} />
        <select aria-label="Cidade" value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="">Todas as cidades</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <ChevronDown size={18} className="select-caret" />
      </label>
      <button type="submit" className="btn btn-primary hero-btn">
        Pesquisar <ArrowRight size={18} />
      </button>
    </form>
  )
}
