import { describe, expect, it } from 'vitest'
import { ROLES } from '../modules/auth/domain/Account'

describe('public account registration roles', () => {
  it('only exposes client and candidate self-registration', () => {
    expect(ROLES).toHaveProperty('CLIENT')
    expect(ROLES).toHaveProperty('CANDIDATE')
    expect(ROLES).not.toHaveProperty('AGENT')
  })
})
