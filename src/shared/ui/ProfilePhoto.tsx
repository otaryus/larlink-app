import { useEffect, useState } from 'react'
import { apiImage } from '../api/client'

export function ProfilePhoto({ accountId, name, size=46 }: { accountId?: string; name: string; size?: number }) {
  const [source, setSource] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    let objectUrl: string | null = null
    if (accountId) void apiImage(`/api/accounts/${accountId}/photo`).then((url) => {
      objectUrl = url
      if (active) setSource(url)
      else if (url) URL.revokeObjectURL(url)
    })
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [accountId])
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?'
  return <div className="profile-photo-avatar" style={{ width:size, height:size }} aria-label={`Fotografia de ${name}`}>
    {source ? <img src={source} alt={`Fotografia de ${name}`} /> : <span>{initials}</span>}
  </div>
}
