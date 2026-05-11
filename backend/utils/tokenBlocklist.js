const revokedTokens = new Map()

function cleanupExpiredTokens(now = Date.now()) {
  for (const [token, expiresAt] of revokedTokens.entries()) {
    if (expiresAt <= now) revokedTokens.delete(token)
  }
}

function revokeToken(token, exp) {
  if (!token) return

  const expiresAt = exp ? exp * 1000 : Date.now() + 24 * 60 * 60 * 1000
  revokedTokens.set(token, expiresAt)
  cleanupExpiredTokens()
}

function isTokenRevoked(token) {
  cleanupExpiredTokens()
  return revokedTokens.has(token)
}

function clearRevokedTokens() {
  revokedTokens.clear()
}

module.exports = {
  clearRevokedTokens,
  isTokenRevoked,
  revokeToken,
}
