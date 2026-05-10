const request = require('supertest');
const express = require('express');
const uploadRoutes = require('../routes/uploadRoutes');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use('/api/upload', uploadRoutes);

describe('Upload Routes - Unit Tests', () => {
  const testFilePath = path.join(__dirname, 'testfile.txt');

  beforeAll(() => {
    fs.writeFileSync(testFilePath, 'contenido de prueba');
    if (!fs.existsSync(path.join(__dirname, '../uploads'))) {
      fs.mkdirSync(path.join(__dirname, '../uploads'));
    }
  });

  afterAll(() => {
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  test('POST /api/upload - Éxito al subir un archivo', async () => {
    const response = await request(app)
      .post('/api/upload')
      .attach('file', testFilePath);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Archivo subido correctamente');
    expect(response.body).toHaveProperty('url');
    
    // Limpiar el archivo subido
    const uploadedPath = path.join(__dirname, '..', response.body.url);
    if (fs.existsSync(uploadedPath)) {
      fs.unlinkSync(uploadedPath);
    }
  });

  test('POST /api/upload - Error si no se envía archivo', async () => {
    const response = await request(app)
      .post('/api/upload');

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('No se subió ningún archivo');
  });
});
