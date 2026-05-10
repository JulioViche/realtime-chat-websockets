const { parentPort } = require('worker_threads')
const jwt = require('jsonwebtoken')

parentPort.on('message', (data) => {
  const { action, payload, secret } = data

  if (action === 'sign') {
    try {
      const token = jwt.sign(payload, secret, { expiresIn: '24h' })
      parentPort.postMessage({ success: true, token })
    } catch (error) {
      parentPort.postMessage({ success: false, error: error.message })
    }
  } else if (action === 'verify') {
    try {
      const decoded = jwt.verify(payload, secret)
      parentPort.postMessage({ success: true, decoded })
    } catch (error) {
      parentPort.postMessage({ success: false, error: error.message })
    }
  }
})
