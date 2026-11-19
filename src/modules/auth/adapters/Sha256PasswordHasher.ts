import type { PasswordHasher } from '../ports/PasswordHasher'

const toHex = (buffer: ArrayBuffer) => [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('')

async function digest(salt: string, password: string): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${password}`)))
}

export class Sha256PasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = toHex(crypto.getRandomValues(new Uint8Array(16)).buffer)
    return `${salt}$${await digest(salt, password)}`
  }

  async verify(password: string, hash: string): Promise<boolean> {
    const [salt, expected] = hash.split('$')
    return !!salt && !!expected && (await digest(salt, password)) === expected
  }
}
