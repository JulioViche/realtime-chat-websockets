const { Worker } = require('worker_threads')
const path = require('path')

const login = (req, res) => {
  const { username, password } = req.body

  const adminUser = process.env.ADMIN_USER
  const adminPass = process.env.ADMIN_PASS

  if (username === adminUser && password === adminPass) {
    // Usar Worker Thread para la generación del token (lógica pesada/criptográfica)
    const worker = new Worker(path.join(__dirname, '../workers/authWorker.js'))

    worker.postMessage({
      action: 'sign',
      payload: { role: 'admin', username },
      secret: process.env.JWT_SECRET,
    })

    worker.on('message', (result) => {
      if (result.success) {
        res.status(200).json({
          message: 'Autenticación exitosa (procesada en hilo independiente)',
          token: result.token,
        })
      } else {
        res.status(500).json({ error: 'Error al generar token' })
      }
      worker.terminate()
    })

    worker.on('error', (err) => {
      console.error('Worker error:', err)
      res.status(500).json({ error: 'Error interno en el worker' })
      worker.terminate()
    })

    return
  }

  return res.status(401).json({ error: 'Credenciales inválidas' })
}

module.exports = {
  login,
}
