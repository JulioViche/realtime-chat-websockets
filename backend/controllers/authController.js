const jwt = require('jsonwebtoken')

const login = (req, res) => {
  const { username, password } = req.body

  const adminUser = process.env.ADMIN_USER
  const adminPass = process.env.ADMIN_PASS

  if (username === adminUser && password === adminPass) {
    const token = jwt.sign(
      { role: 'admin', username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
    )

    return res.status(200).json({
      message: 'Autenticación exitosa',
      token,
    })
  }

  return res.status(401).json({ error: 'Credenciales inválidas' })
}

module.exports = {
  login,
}
