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

const mockRoomFind = (rooms) => {
  Room.find.mockReturnValue({
    select: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(rooms),
      sort: jest.fn().mockResolvedValue(rooms)
    })
  });
};

describe('Room Controller - Unit Tests', () => {
  beforeEach(() => {
    Room.findOne = jest.fn().mockResolvedValue(null);
    Room.generatePinFingerprint = jest.fn((pin) => `fingerprint_${pin}`);
    Room.decryptPin = jest.fn((encryptedPin) => {
      if (!encryptedPin) return null;
      return encryptedPin.replace('encrypted_', '');
    });
    Room.PIN_SECURITY_MODES = {
      RECOVERABLE: 'RECOVERABLE',
      NON_RECOVERABLE: 'NON_RECOVERABLE'
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/rooms - Éxito al crear una sala', async () => {
    const mockRoom = {
      _id: 'room_id_123',
      name: 'Sala Test',
      pinEncrypted: 'encrypted_1234',
      pinSecurityMode: 'RECOVERABLE',
      type: 'TEXT'
    };

    Room.prototype.save = jest.fn().mockResolvedValue(mockRoom);

    const response = await request(app)
      .post('/api/rooms')
      .send({ name: 'Sala Test', pin: '1234', type: 'TEXT' });

    expect(response.statusCode).toBe(201);
    expect(response.body.message).toBe('Sala creada exitosamente');
    expect(response.body.room.pin).toBe('1234');
    expect(response.body.room.pinSecurityMode).toBe('RECOVERABLE');
    expect(response.body.room.pinCanBeRecovered).toBe(true);
  });

  test('POST /api/rooms - Crea sala con PIN no recuperable', async () => {
    const mockRoom = {
      _id: 'room_id_123',
      name: 'Sala Segura',
      pinEncrypted: undefined,
      pinSecurityMode: 'NON_RECOVERABLE',
      type: 'TEXT'
    };

    Room.prototype.save = jest.fn().mockResolvedValue(mockRoom);

    const response = await request(app)
      .post('/api/rooms')
      .send({
        name: 'Sala Segura',
        pin: '1234',
        type: 'TEXT',
        pinSecurityMode: 'NON_RECOVERABLE'
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.room.pin).toBeNull();
    expect(response.body.room.pinSecurityMode).toBe('NON_RECOVERABLE');
    expect(response.body.room.pinCanBeRecovered).toBe(false);
  });

  test('POST /api/rooms - Error con modo de seguridad inválido', async () => {
    const response = await request(app)
      .post('/api/rooms')
      .send({
        name: 'Sala Test',
        pin: '1234',
        pinSecurityMode: 'PLAIN_TEXT'
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('Modo de seguridad del PIN inválido');
  });

  test('POST /api/rooms - Error si falta el nombre', async () => {
    const response = await request(app)
      .post('/api/rooms')
      .send({ type: 'TEXT' });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('El nombre de la sala es obligatorio');
  });

  test('GET /api/rooms/:pin/messages - Error si la sala no existe', async () => {
    mockRoomFind([]);

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

    mockRoomFind([mockRoom]);
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

    mockRoomFind([mockRoom]);
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
    const response = await request(app)
      .post('/api/rooms')
      .send({ name: 'Error', pin: '1234' });

    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe('Error al crear la sala');
  });

  test('GET /api/rooms - Éxito al obtener todas las salas', async () => {
    const mockRooms = [
      { name: 'S1', pin: 'hash', pinFingerprint: 'fp1', pinEncrypted: 'encrypted_1111', pinSecurityMode: 'RECOVERABLE' },
      { name: 'S2', pin: 'hash', pinFingerprint: 'fp2', pinEncrypted: undefined, pinSecurityMode: 'NON_RECOVERABLE' }
    ];
    mockRoomFind(mockRooms);

    const response = await request(app).get('/api/rooms');

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].pin).toBe('1111');
    expect(response.body[0].pinCanBeRecovered).toBe(true);
    expect(response.body[0].pinFingerprint).toBeUndefined();
    expect(response.body[1].pin).toBeNull();
    expect(response.body[1].pinCanBeRecovered).toBe(false);
    expect(response.body[1].pinFingerprint).toBeUndefined();
  });

  test('DELETE /api/rooms/bulk - Éxito al eliminar salas seleccionadas', async () => {
    mockRoomFind([{ _id: 'r1' }, { _id: 'r2' }]);
    Room.deleteMany.mockResolvedValue({ deletedCount: 2 });
    Message.deleteMany.mockResolvedValue({});

    const response = await request(app)
      .delete('/api/rooms/bulk')
      .send({ ids: ['r1', 'r2'] });

    expect(response.statusCode).toBe(200);
    expect(response.body.deletedCount).toBe(2);
    expect(Room.deleteMany).toHaveBeenCalledWith({ _id: { $in: ['r1', 'r2'] } });
    expect(Message.deleteMany).toHaveBeenCalledWith({ roomId: { $in: ['r1', 'r2'] } });
  });

  test('DELETE /api/rooms/bulk - Éxito al eliminar todas las salas', async () => {
    mockRoomFind([{ _id: 'r1' }]);
    Room.deleteMany.mockResolvedValue({ deletedCount: 1 });
    Message.deleteMany.mockResolvedValue({});

    const response = await request(app)
      .delete('/api/rooms/bulk')
      .send({ all: true });

    expect(response.statusCode).toBe(200);
    expect(response.body.deletedCount).toBe(1);
    expect(Room.find).toHaveBeenCalledWith({});
  });

  test('DELETE /api/rooms/bulk - Error si no hay salas seleccionadas', async () => {
    const response = await request(app)
      .delete('/api/rooms/bulk')
      .send({ ids: [] });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('Selecciona al menos una sala para eliminar');
  });

  test('DELETE /api/rooms/:id - Éxito al eliminar sala', async () => {
    Room.findByIdAndDelete.mockResolvedValue({ _id: '123' });
    Message.deleteMany.mockResolvedValue({});

    const response = await request(app).delete('/api/rooms/123');

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Sala eliminada exitosamente');
  });
});
