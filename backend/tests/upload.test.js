const request = require('supertest');
const express = require('express');
const uploadRoutes = require('../routes/uploadRoutes');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use('/api/upload', uploadRoutes);

describe('Upload Routes - Unit Tests', () => {
  const validFilePath = path.join(__dirname, 'testimage.png');
  const invalidFilePath = path.join(__dirname, 'testfile.txt');
  const largeFilePath = path.join(__dirname, 'largefile.png');

  beforeAll(() => {
    // Crear un archivo de imagen (simulado)
    fs.writeFileSync(validFilePath, 'fake image data');
    // Crear un archivo de texto (inválido)
    fs.writeFileSync(invalidFilePath, 'contenido de prueba');
    // Crear un archivo grande (>10MB)
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
    fs.writeFileSync(largeFilePath, largeBuffer);

    if (!fs.existsSync(path.join(__dirname, '../uploads'))) {
      fs.mkdirSync(path.join(__dirname, '../uploads'));
    }
  });

  afterAll(() => {
    if (fs.existsSync(validFilePath)) fs.unlinkSync(validFilePath);
    if (fs.existsSync(invalidFilePath)) fs.unlinkSync(invalidFilePath);
    if (fs.existsSync(largeFilePath)) fs.unlinkSync(largeFilePath);
  });

  test('POST /api/upload - Éxito al subir un archivo válido (PNG)', async () => {
    const response = await request(app)
      .post('/api/upload')
      .attach('file', validFilePath);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Archivo subido y procesado en hilo independiente');
    expect(response.body).toHaveProperty('url');
    
    // Limpiar el archivo subido
    const uploadedPath = path.join(__dirname, '..', response.body.url);
    if (fs.existsSync(uploadedPath)) {
      fs.unlinkSync(uploadedPath);
    }
  });

  test('POST /api/upload - Error si el tipo de archivo no es permitido (.txt)', async () => {
    const response = await request(app)
      .post('/api/upload')
      .attach('file', invalidFilePath);

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toContain('Solo se permiten imágenes');
  });

  test('POST /api/upload - Error si el archivo excede 10MB', async () => {
    const response = await request(app)
      .post('/api/upload')
      .attach('file', largeFilePath);

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toContain('demasiado grande');
  });

  test('POST /api/upload - Error si no se envía archivo', async () => {
    const response = await request(app)
      .post('/api/upload');

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('No se subió ningún archivo');
  });
});
