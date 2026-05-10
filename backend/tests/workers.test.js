const socketWorker = require('../workers/socketWorker');
const roomWorker = require('../workers/roomWorker');

describe('Worker Logic Unit Tests (Piscina Compatible)', () => {
  
  describe('socketWorker.js', () => {
    test('action: validateJoin - should return existing session if IP matches', async () => {
      const payload = {
        usuarios: [['old-socket', { user: 'OldUser', roomId: 'room1', ip: '1.2.3.4' }]],
        socketId: 'new-socket',
        userIp: '1.2.3.4',
        roomId: 'room1',
        user: 'NewUser'
      };

      const result = await socketWorker({ action: 'validateJoin', payload });
      expect(result.existingSession.user).toBe('OldUser');
      expect(result.isDuplicateName).toBe(false);
    });

    test('action: validateJoin - should return duplicate name if name matches in same room', async () => {
      const payload = {
        usuarios: [['other-socket', { user: 'TestUser', roomId: 'room1', ip: '5.6.7.8' }]],
        socketId: 'my-socket',
        userIp: '1.2.3.4',
        roomId: 'room1',
        user: 'TestUser'
      };

      const result = await socketWorker({ action: 'validateJoin', payload });
      expect(result.isDuplicateName).toBe(true);
      expect(result.existingSession).toBeNull();
    });

    test('action: filterUsers - should return list of nicknames in room', async () => {
      const payload = {
        usuarios: [
          ['s1', { user: 'User1', roomId: 'roomA' }],
          ['s2', { user: 'User2', roomId: 'roomB' }],
          ['s3', { user: 'User3', roomId: 'roomA' }]
        ],
        roomId: 'roomA'
      };

      const result = await socketWorker({ action: 'filterUsers', payload });
      expect(result).toContain('User1');
      expect(result).toContain('User3');
      expect(result).not.toContain('User2');
    });
  });

  describe('roomWorker.js', () => {
    test('action: generatePin - should return a 6-digit numeric string', async () => {
      const pin = await roomWorker({ action: 'generatePin' });
      expect(pin).toMatch(/^\d{6}$/);
    });

    test('action: verifyRoomPin - should return matching room', async () => {
      const bcrypt = require('bcrypt');
      const hashedPin = await bcrypt.hash('123456', 10);
      const rooms = [
        { _id: 'r1', pin: hashedPin },
        { _id: 'r2', pin: 'other' }
      ];

      const result = await roomWorker({ 
        action: 'verifyRoomPin', 
        payload: { pin: '123456', rooms } 
      });
      expect(result._id).toBe('r1');
    });
  });

  describe('fileWorker.js', () => {
    // Nota: fileWorker.js sigue usando parentPort porque se usa vía new Worker() en uploadRoutes.js
    // No se optimizó a Piscina en el plan actual (solo sockets y salas).
  });
});
