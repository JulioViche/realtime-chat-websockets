const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/authRoutes');
const jwt = require('jsonwebtoken');

// Mock de variables de entorno
process.env.ADMIN_USER = 'admin';
process.env.ADMIN_PASS = 'admin123';
process.env.JWT_SECRET = 'test_secret';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Controller - Unit Tests', () => {
  test('POST /api/auth/login - Éxito con credenciales correctas', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.message).toBe('Autenticación exitosa');
    
    // Verificar que el token sea válido
    const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
    expect(decoded.role).toBe('admin');
    expect(decoded.username).toBe('admin');
  });

  test('POST /api/auth/login - Error con credenciales incorrectas', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'wrong_user',
        password: 'wrong_password'
      });

    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBe('Credenciales inválidas');
  });

  test('POST /api/auth/login - Error con campos vacíos', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(response.statusCode).toBe(401);
  });
});
