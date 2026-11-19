const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '')
const TOKEN_KEY = 'larlink.token'

export interface ApiAccount { token: string; id: string; name: string; email: string; role: string; mustChangePassword: boolean }

export function getToken(): string | null { return localStorage.getItem(TOKEN_KEY) }
export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  let response: Response
  try { response = await fetch(`${API_URL}${path}`, { ...options, headers }) }
  catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('O pedido demorou demasiado tempo. Verifique “Os meus pedidos” antes de tentar novamente.')
    throw new Error('Não foi possível contactar o LarLink. Confirme se a API está ligada em http://localhost:8080.')
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null) as { error?: string; fields?: Record<string, string> } | null
    const detail = data?.fields ? Object.values(data.fields).join(' ') : data?.error
    throw new Error(detail || `Pedido falhou (${response.status}).`)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export async function apiImage(path: string): Promise<string | null> {
  const headers = new Headers()
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  try {
    const response = await fetch(`${API_URL}${path}`, { headers, cache: 'no-store' })
    if (!response.ok) return null
    return URL.createObjectURL(await response.blob())
  } catch { return null }
}

export async function downloadApiFile(path: string, filename: string): Promise<void> {
  const headers = new Headers()
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(`${API_URL}${path}`, { headers, cache: 'no-store' })
  if (!response.ok) {
    const data = await response.json().catch(() => null) as { error?: string } | null
    throw new Error(data?.error || `Não foi possível descarregar o ficheiro (${response.status}).`)
  }
  const url = URL.createObjectURL(await response.blob())
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function json(body: unknown): Pick<RequestInit, 'method' | 'body'> {
  return { method: 'POST', body: JSON.stringify(body) }
}
