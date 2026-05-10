const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

// Mock del middleware antes de requerir las rutas
jest.mock('../middlewares/authMiddleware', () => ({
  verifyAdminToken: (req, res, next) => {
    req.admin = { role: 'admin' };
    next();
  }
}));

// Mock de Piscina para evitar hilos reales en tests
jest.mock('piscina', () => {
  return jest.fn().mockImplementation(() => ({
    run: jest.fn().mockImplementation(async ({ action, payload }) => {
      if (action === 'generatePin') return '123456';
      if (action === 'verifyRoomPin') {
        if (!payload.rooms || payload.rooms.length === 0) return null;
        return { _id: 'room_id_123', type: 'TEXT' }; 
      }
      return null;
    })
  }));
});

const roomRoutes = require('../routes/roomRoutes');
const Room = require('../models/Room');
const Message = require('../models/Message');

const app = express();
app.use(express.json());
app.use('/api/rooms', roomRoutes);

// Mock de Mongoose para evitar conexión real a BD durante el test unitario
jest.mock('../models/Room');
jest.mock('../models/Message');
jest.mock('../models/File');

describe('Room Controller - Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/rooms - Éxito al crear una sala', async () => {
    const mockRoom = {
      _id: 'room_id_123',
      name: 'Sala Test',
      pin: 'TEST12',
      type: 'TEXT'
    };

    Room.prototype.save = jest.fn().mockResolvedValue(mockRoom);

    const response = await request(app)
      .post('/api/rooms')
      .send({ name: 'Sala Test', type: 'TEXT' });

    expect(response.statusCode).toBe(201);
    expect(response.body.message).toBe('Sala creada exitosamente');
    expect(response.body.room).toHaveProperty('pin');
  });

  test('POST /api/rooms - Error si falta el nombre', async () => {
    const response = await request(app)
      .post('/api/rooms')
      .send({ type: 'TEXT' });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('El nombre de la sala es obligatorio');
  });

  test('GET /api/rooms/:pin/messages - Error si la sala no existe', async () => {
    Room.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([])
    });

    const response = await request(app).get('/api/rooms/NONEXIST/messages');

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe('Sala no encontrada o PIN incorrecto');
  });

  test('GET /api/rooms/:pin/messages - Éxito al obtener mensajes', async () => {
    const mockRoom = { 
      _id: 'room_id_123', 
      type: 'TEXT', 
      pin: 'hashed_pin', 
      isActive: true,
      comparePin: jest.fn().mockResolvedValue(true)
    };
    const mockMessages = [
      { _id: 'msg1', content: 'Hola', type: 'TEXT', toObject: () => ({ content: 'Hola', type: 'TEXT' }) }
    ];

    Room.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([mockRoom])
    });
    Message.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue(mockMessages)
    });

    const response = await request(app).get('/api/rooms/123456/messages');

    expect(response.statusCode).toBe(200);
    expect(response.body.messages).toHaveLength(1);
    expect(response.body.messages[0].content).toBe('Hola');
  });

  test('GET /api/rooms/:pin/messages - Éxito al obtener mensajes con archivos (MULTIMEDIA)', async () => {
    const File = require('../models/File');
    const mockRoom = { 
      _id: 'room_id_123', 
      type: 'MULTIMEDIA', 
      pin: 'hashed_pin', 
      isActive: true,
      comparePin: jest.fn().mockResolvedValue(true)
    };
    const mockMessages = [
      { 
        _id: 'msg_file', 
        content: 'ver archivo', 
        type: 'FILE', 
        toObject: function() { return { _id: this._id, content: this.content, type: this.type }; }
      }
    ];
    const mockFile = { name: 'test.jpg', url: '/uploads/test.jpg', type: 'image/jpeg' };

    Room.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([mockRoom])
    });
    Message.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue(mockMessages)
    });
    File.findOne.mockResolvedValue(mockFile);

    const response = await request(app).get('/api/rooms/MEMES1/messages');

    expect(response.statusCode).toBe(200);
    expect(response.body.messages[0]).toHaveProperty('file');
    expect(response.body.messages[0].file.name).toBe('test.jpg');
  });

  test('POST /api/rooms - Manejo de errores internos', async () => {
    Room.prototype.save = jest.fn().mockRejectedValue(new Error('DB Error'));
    const response = await request(app).post('/api/rooms').send({ name: 'Error' });
    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe('Error al crear la sala');
  });

  test('GET /api/rooms - Éxito al obtener todas las salas', async () => {
    const mockRooms = [{ name: 'S1' }, { name: 'S2' }];
    Room.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue(mockRooms)
    });

    const response = await request(app).get('/api/rooms');

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(2);
  });

  test('DELETE /api/rooms/:id - Éxito al eliminar sala', async () => {
    Room.findByIdAndDelete.mockResolvedValue({ _id: '123' });
    Message.deleteMany.mockResolvedValue({});

    const response = await request(app).delete('/api/rooms/123');

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Sala eliminada exitosamente');
  });
});
