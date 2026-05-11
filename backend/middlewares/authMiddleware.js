const jwt = require('jsonwebtoken')
const { isTokenRevoked } = require('../utils/tokenBlocklist')

const verifyAdminToken = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de acceso no proporcionado' })
  }

  const token = authHeader.split(' ')[1]

  try {
    if (isTokenRevoked(token)) {
      return res.status(401).json({ error: 'Token inválido o expirado' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (decoded.role !== 'admin') {
      return res
        .status(403)
        .json({ error: 'No tienes permisos de administrador' })
    }

    req.admin = decoded
    req.token = token
    next() // Pasa al siguiente middleware o controlador (ej: crear sala)
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

module.exports = {
  verifyAdminToken,
}
