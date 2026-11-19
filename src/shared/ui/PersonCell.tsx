import { Portrait } from './Portrait'

export function PersonCell({ id, name, detail }: { id: string; name: string; detail?: string }) {
  return (
    <span className="person-cell">
      <Portrait seed={id} className="avatar avatar-sm" />
      <span>
        <strong>{name}</strong>
        {detail && <small>{detail}</small>}
      </span>
    </span>
  )
}
