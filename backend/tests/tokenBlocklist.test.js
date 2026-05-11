const {
  clearRevokedTokens,
  isTokenRevoked,
  revokeToken,
} = require('../utils/tokenBlocklist')

describe('Token Blocklist - Unit Tests', () => {
  beforeEach(() => {
    clearRevokedTokens()
  })

  test('revokeToken stores a token until it expires', () => {
    revokeToken('active-token', Math.floor(Date.now() / 1000) + 60)

    expect(isTokenRevoked('active-token')).toBe(true)
  })

  test('expired revoked tokens are cleaned automatically', () => {
    revokeToken('expired-token', Math.floor(Date.now() / 1000) - 60)

    expect(isTokenRevoked('expired-token')).toBe(false)
  })

  test('empty tokens are ignored', () => {
    revokeToken('')

    expect(isTokenRevoked('')).toBe(false)
  })
})
