import type { LucideIcon } from 'lucide-react'

export interface TabItem<K extends string> {
  key: K
  label: string
  icon?: LucideIcon
  count?: number
}

interface Props<K extends string> {
  items: TabItem<K>[]
  active: K
  onChange: (key: K) => void
  label: string
}

export function Tabs<K extends string>({ items, active, onChange, label }: Props<K>) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {items.map(({ key, label: text, icon: Icon, count }) => (
        <button
          key={key}
          role="tab"
          aria-selected={key === active}
          className={key === active ? 'tab active' : 'tab'}
          onClick={() => onChange(key)}
        >
          {Icon && <Icon size={20} strokeWidth={1.8} />}
          {text}
          {count !== undefined && <span className="tab-count">{count}</span>}
        </button>
      ))}
    </div>
  )
}
