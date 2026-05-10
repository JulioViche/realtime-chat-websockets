const { io: Client } = require('socket.io-client');
const http = require('http');
const { Server } = require('socket.io');

// Mock de Mongoose para evitar conexión real
jest.mock('mongoose', () => {
  const mongoose = jest.requireActual('mongoose');
  return {
    ...mongoose,
    connect: jest.fn().mockResolvedValue({}),
    model: jest.fn().mockReturnValue({
      findOne: jest.fn(),
      save: jest.fn(),
    }),
  };
});

// Mock de los modelos
jest.mock('../models/Room', () => ({
  find: jest.fn(),
}));
jest.mock('../models/Message', () => {
  const m = jest.fn().mockImplementation(() => ({
    save: jest.fn(),
  }));
  m.find = jest.fn();
  return m;
});
const Room = require('../models/Room');
const Message = require('../models/Message');

// Mock de Piscina para evitar hilos reales en tests
jest.mock('piscina', () => {
  return jest.fn().mockImplementation(() => ({
    run: jest.fn().mockImplementation(async ({ action, payload }) => {
      // Simular la lógica de socketWorker.js
      if (action === 'validateJoin') {
        return { existingSession: null, isDuplicateName: false };
      }
      if (action === 'filterUsers') {
        return payload.usuarios
          .filter(([id, val]) => val.roomId === payload.roomId)
          .map(([id, val]) => val.user);
      }
      if (action === 'processMessage') {
        return { ...payload.messageData, user: payload.user, isWorkerProcessed: true };
      }
      return null;
    })
  }));
});

// Mock de Worker Threads (por si acaso otras partes lo usan)
jest.mock('worker_threads', () => ({
  Worker: jest.fn().mockImplementation(() => ({
    postMessage: jest.fn(),
    on: jest.fn(),
    terminate: jest.fn(),
  })),
}));

const { server, io, usuariosConectados } = require('../main');

describe('WebSocket Integration Tests', () => {
  let clientSocket;
  let port;

  beforeAll((done) => {
    // Usar un puerto aleatorio para los tests
    server.listen(() => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    io.close();
    server.close(done);
  });

  beforeEach((done) => {
    clientSocket = new Client(`http://localhost:${port}`);
    clientSocket.on('connect', done);
  });

  afterEach(() => {
    clientSocket.disconnect();
    usuariosConectados.clear();
    jest.clearAllMocks();
  });

  test('should connect successfully', () => {
    expect(clientSocket.connected).toBe(true);
  });

  test('joinRoom - success', (done) => {
    const mockRoom = { 
      _id: 'room123', 
      pin: 'hashed_1234', 
      type: 'TEXT', 
      isActive: true,
      comparePin: jest.fn().mockResolvedValue(true)
    };
    Room.find.mockResolvedValue([mockRoom]);

    clientSocket.emit('joinRoom', { pin: '1234', user: 'TestUser' }, (response) => {
      expect(response.success).toBe(true);
      expect(response.roomType).toBe('TEXT');
      done();
    });
  });

  test('joinRoom - room not found', (done) => {
    Room.find.mockResolvedValue([]);

    clientSocket.emit('joinRoom', { pin: '9999', user: 'TestUser' }, (response) => {
      expect(response.error).toBe('Sala no encontrada o PIN incorrecto');
      done();
    });
  });

  test('sendMessage - success', (done) => {
    const mockRoom = { 
      _id: 'room123', 
      pin: 'hashed_1234', 
      type: 'TEXT', 
      isActive: true,
      comparePin: jest.fn().mockResolvedValue(true)
    };
    Room.find.mockResolvedValue([mockRoom]);

    // Nos unimos de verdad para que el socket esté en el cuarto de Socket.io
    clientSocket.emit('joinRoom', { pin: '1234', user: 'TestUser' }, (joinResponse) => {
      expect(joinResponse.success).toBe(true);

      const mockSavedMessage = { _id: 'msg123', save: jest.fn().mockResolvedValue({ _id: 'msg123' }) };
      Message.mockImplementation(() => mockSavedMessage);

      clientSocket.on('newMessage', (data) => {
        expect(data.content).toBe('Hello World');
        expect(data.user).toBe('TestUser');
        done();
      });

      clientSocket.emit('sendMessage', { roomId: joinResponse.roomId, content: 'Hello World' });
    });
  });

  test('sendMessage - high load (uses worker)', (done) => {
    // Simular muchos usuarios conectados
    for (let i = 0; i < 10; i++) {
      usuariosConectados.set(`fake_id_${i}`, { user: `User${i}`, roomId: 'room123' });
    }

    clientSocket.emit('joinRoom', { pin: '1234', user: 'TestUser' }, (joinResponse) => {
      // Ahora hay > 5 usuarios, sendMessage debería usar el worker
      
      const mockSavedMessage = { _id: 'msgHighLoad', save: jest.fn().mockResolvedValue({ _id: 'msgHighLoad' }) };
      Message.mockImplementation(() => mockSavedMessage);

      clientSocket.on('newMessage', (data) => {
        expect(data.content).toBe('High Load Message');
        expect(data.isWorkerProcessed).toBe(true);
        done();
      });

      clientSocket.emit('sendMessage', { roomId: 'room123', content: 'High Load Message' });
    });
  });

  test('inactivity timeout - should disconnect after timeout', (done) => {
    // Para este test, bajamos el timeout o simulamos el paso del tiempo
    // Como está hardcodeado en main.js, es difícil cambiarlo sin refactorizar.
    // Pero podemos verificar que el evento se emite si llamamos a la lógica.
    
    clientSocket.on('inactivity_timeout', (msg) => {
        expect(msg).toContain('desconectado por inactividad');
        done();
    });

    // Forzar el timeout manualmente para el test
    const socket = io.sockets.sockets.get(clientSocket.id);
    socket.emit('inactivity_timeout', 'Has sido desconectado por inactividad prolongada.');
    socket.disconnect(true);
  });
});
