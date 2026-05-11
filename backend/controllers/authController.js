const { Worker } = require('worker_threads')
const path = require('path')
const Admin = require('../models/Admin')
const { revokeToken } = require('../utils/tokenBlocklist')

const loginAttempts = new Map()
const MAX_FAILED_ATTEMPTS = 5
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000

function getClientKey(req) {
  return req.ip || req.socket?.remoteAddress || req.headers['x-forwarded-for'] || 'unknown'
}

function getAttemptState(key) {
  const now = Date.now()
  const state = loginAttempts.get(key)

  if (!state || state.resetAt <= now) {
    const freshState = { count: 0, resetAt: now + ATTEMPT_WINDOW_MS }
    loginAttempts.set(key, freshState)
    return freshState
  }

  return state
}

function registerFailedAttempt(key) {
  const state = getAttemptState(key)
  state.count += 1
  loginAttempts.set(key, state)
}

function clearAttempts(key) {
  loginAttempts.delete(key)
}

const signAdminToken = (payload, res) => {
  const worker = new Worker(path.join(__dirname, '../workers/authWorker.js'))

  worker.postMessage({
    action: 'sign',
    payload,
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
}

const login = async (req, res) => {
  const { username, password } = req.body
  const clientKey = getClientKey(req)
  const attemptState = getAttemptState(clientKey)

  if (attemptState.count >= MAX_FAILED_ATTEMPTS) {
    return res.status(429).json({ error: 'Demasiados intentos fallidos. Intenta más tarde.' })
  }

  if (!username || !password) {
    registerFailedAttempt(clientKey)
    return res.status(401).json({ error: 'Credenciales inválidas' })
  }

  try {
    const admin = await Admin.findOne({ username, isActive: true }).select('+password')

    if (!admin || !(await admin.comparePassword(password))) {
      registerFailedAttempt(clientKey)
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    clearAttempts(clientKey)
    return signAdminToken(
      {
        role: 'admin',
        username: admin.username,
        adminId: admin._id.toString(),
      },
      res,
    )
  } catch (error) {
    console.error('Error en login admin:', error)
    return res.status(500).json({ error: 'Error interno de autenticación' })
  }
}

const logout = (req, res) => {
  revokeToken(req.token, req.admin?.exp)
  return res.status(200).json({ message: 'Sesión cerrada correctamente' })
}

module.exports = {
  _loginAttempts: loginAttempts,
  login,
  logout,
}
