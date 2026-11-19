import { ChevronRight, Heart, LayoutGrid, ShieldCheck, Smile, UserRound, Utensils } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Skill } from '../../modules/housekeepers/domain/Housekeeper'
import type { SearchFilter } from '../../modules/placement/domain/Search'
import { CandidateCard } from '../../modules/placement/ui/CandidateCard'
import { toCandidateCards } from '../../modules/placement/ui/candidateCards'
import { HeroSearch } from '../../modules/placement/ui/HeroSearch'
import { RecentPlacements } from '../../modules/placement/ui/RecentPlacements'
import { StatsPanel } from '../../modules/reports/ui/StatsPanel'
import { useQuery } from '../../shared/ui/ContainerContext'
import { Portrait } from '../../shared/ui/Portrait'
import { Tabs, type TabItem } from '../../shared/ui/Tabs'
import { useFavorites } from '../../shared/ui/useFavorites'

type Category = 'ALL' | 'CHILDCARE' | 'COOKING' | 'ELDERLY' | 'OTHER'

const CATEGORIES: (TabItem<Category> & { skills?: Skill[] })[] = [
  { key: 'ALL', label: 'Candidatas', icon: UserRound },
  { key: 'CHILDCARE', label: 'Babás', icon: Smile, skills: ['CHILDCARE'] },
  { key: 'COOKING', label: 'Cozinheiras', icon: Utensils, skills: ['COOKING'] },
  { key: 'ELDERLY', label: 'Cuidadoras de idosos', icon: Heart, skills: ['ELDERLY_CARE'] },
  { key: 'OTHER', label: 'Outros serviços', icon: LayoutGrid, skills: ['LAUNDRY', 'GARDENING'] },
]

const PAGE_SIZE = 6

export function HomePage() {
  const [category, setCategory] = useState<Category>('ALL')
  const [filter, setFilter] = useState<SearchFilter>({})
  const [visible, setVisible] = useState(PAGE_SIZE)
  const favorites = useFavorites()
  const skills = CATEGORIES.find((c) => c.key === category)?.skills

  const cards = useQuery(
    async (c) => toCandidateCards(c, await c.useCases.searchHousekeepers({ ...filter, skills })),
    [],
    [category, filter],
  )

  function changeCategory(key: Category) {
    setCategory(key)
    setVisible(PAGE_SIZE)
  }

  return (
    <div className="home">
      <div className="home-main">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Pessoas certas. Lares felizes.</p>
            <h1>Encontre a empregada doméstica ideal</h1>
            <p className="hero-sub">Profissionais qualificadas, verificadas e de confiança para o seu lar.</p>
          </div>
          <Portrait seed="hero-larlink" className="hero-art" />
          <HeroSearch
            onSearch={(f) => {
              setFilter(f)
              setVisible(PAGE_SIZE)
            }}
          />
        </section>

        <section className="catalog">
          <Tabs label="Categorias" items={CATEGORIES} active={category} onChange={changeCategory} />
          {cards.length === 0 ? (
            <p className="empty">Nenhuma candidata disponível com estes critérios.</p>
          ) : (
            <div className="card-grid">
              {cards.slice(0, visible).map((card) => (
                <CandidateCard
                  key={card.housekeeper.id}
                  card={card}
                  favorite={favorites.isFavorite(card.housekeeper.id)}
                  onToggleFavorite={() => favorites.toggle(card.housekeeper.id)}
                />
              ))}
            </div>
          )}
          {visible < cards.length && (
            <button className="btn btn-soft load-more" onClick={() => setVisible(visible + PAGE_SIZE)}>
              Ver mais candidatas
            </button>
          )}
        </section>
      </div>

      <aside className="home-rail">
        <StatsPanel />
        <RecentPlacements />
        <Link to="/candidatas" className="panel verified-banner">
          <span className="verified-icon"><ShieldCheck size={28} strokeWidth={1.8} /></span>
          <span>
            <strong>Profissionais verificadas</strong>
            <small>Todos os perfis passam por validação de documentos e referências.</small>
          </span>
          <ChevronRight size={20} />
        </Link>
      </aside>
    </div>
  )
}
