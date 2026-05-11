const request = require('supertest')
const express = require('express')
const jwt = require('jsonwebtoken')

jest.mock('../models/Admin', () => ({
  findOne: jest.fn(),
}))

const Admin = require('../models/Admin')
const authController = require('../controllers/authController')
const { clearRevokedTokens } = require('../utils/tokenBlocklist')
const authRoutes = require('../routes/authRoutes')

process.env.JWT_SECRET = 'test_secret'

const app = express()
app.use(express.json())
app.use('/api/auth', authRoutes)

function mockAdminQuery(admin) {
  Admin.findOne.mockReturnValue({
    select: jest.fn().mockResolvedValue(admin),
  })
}

describe('Auth Controller - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    authController._loginAttempts.clear()
    clearRevokedTokens()
  })

  test('POST /api/auth/login - Éxito con credenciales correctas desde MongoDB', async () => {
    mockAdminQuery({
      _id: { toString: () => 'admin-id-1' },
      username: 'admin',
      comparePassword: jest.fn().mockResolvedValue(true),
    })

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123',
      })

    expect(response.statusCode).toBe(200)
    expect(response.body).toHaveProperty('token')
    expect(response.body.message).toBe('Autenticación exitosa (procesada en hilo independiente)')

    const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET)
    expect(decoded.role).toBe('admin')
    expect(decoded.username).toBe('admin')
    expect(decoded.adminId).toBe('admin-id-1')
    expect(Admin.findOne).toHaveBeenCalledWith({ username: 'admin', isActive: true })
  })

  test('POST /api/auth/login - Error con usuario inexistente', async () => {
    mockAdminQuery(null)

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'wrong_user',
        password: 'wrong_password',
      })

    expect(response.statusCode).toBe(401)
    expect(response.body.error).toBe('Credenciales inválidas')
  })

  test('POST /api/auth/login - Error con contraseña incorrecta', async () => {
    mockAdminQuery({
      _id: { toString: () => 'admin-id-1' },
      username: 'admin',
      comparePassword: jest.fn().mockResolvedValue(false),
    })

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'bad-password',
      })

    expect(response.statusCode).toBe(401)
    expect(response.body.error).toBe('Credenciales inválidas')
  })

  test('POST /api/auth/login - Error con campos vacíos', async () => {
    const response = await request(app).post('/api/auth/login').send({})

    expect(response.statusCode).toBe(401)
    expect(response.body.error).toBe('Credenciales inválidas')
    expect(Admin.findOne).not.toHaveBeenCalled()
  })

  test('POST /api/auth/login - Bloquea demasiados intentos fallidos', async () => {
    mockAdminQuery(null)

    for (let i = 0; i < 5; i += 1) {
      await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'bad-password' })
    }

    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'bad-password' })

    expect(response.statusCode).toBe(429)
    expect(response.body.error).toBe('Demasiados intentos fallidos. Intenta más tarde.')
  })

  test('POST /api/auth/logout - Revoca token y evita reutilizarlo', async () => {
    const token = jwt.sign({ role: 'admin', username: 'admin' }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    })

    const logoutResponse = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`)

    expect(logoutResponse.statusCode).toBe(200)
    expect(logoutResponse.body.message).toBe('Sesión cerrada correctamente')

    const secondLogoutResponse = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`)

    expect(secondLogoutResponse.statusCode).toBe(401)
  })
})
