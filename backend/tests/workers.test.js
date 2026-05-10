const { Worker } = require('worker_threads');
const path = require('path');

describe('Worker Threads Unit Tests', () => {
  
  describe('socketWorker.js', () => {
    let socketWorker;

    beforeEach(() => {
      socketWorker = new Worker(path.join(__dirname, '../workers/socketWorker.js'));
    });

    afterEach(async () => {
      await socketWorker.terminate();
    });

    test('action: validateJoin - should return existing session if IP matches', (done) => {
      const payload = {
        usuarios: [['old-socket', { user: 'OldUser', roomId: 'room1', ip: '1.2.3.4' }]],
        socketId: 'new-socket',
        userIp: '1.2.3.4',
        roomId: 'room1',
        user: 'NewUser'
      };

      socketWorker.on('message', (msg) => {
        expect(msg.action).toBe('validateJoinResult');
        expect(msg.result.existingSession.user).toBe('OldUser');
        expect(msg.result.isDuplicateName).toBe(false);
        done();
      });

      socketWorker.postMessage({ action: 'validateJoin', payload });
    });

    test('action: validateJoin - should return duplicate name if name matches in same room', (done) => {
      const payload = {
        usuarios: [['other-socket', { user: 'TestUser', roomId: 'room1', ip: '5.6.7.8' }]],
        socketId: 'my-socket',
        userIp: '1.2.3.4',
        roomId: 'room1',
        user: 'TestUser'
      };

      socketWorker.on('message', (msg) => {
        expect(msg.result.isDuplicateName).toBe(true);
        expect(msg.result.existingSession).toBeNull();
        done();
      });

      socketWorker.postMessage({ action: 'validateJoin', payload });
    });

    test('action: filterUsers - should return list of nicknames in room', (done) => {
      const payload = {
        usuarios: [
          ['s1', { user: 'User1', roomId: 'roomA' }],
          ['s2', { user: 'User2', roomId: 'roomB' }],
          ['s3', { user: 'User3', roomId: 'roomA' }]
        ],
        roomId: 'roomA'
      };

      socketWorker.on('message', (msg) => {
        expect(msg.action).toBe('filterUsersResult');
        expect(msg.result).toContain('User1');
        expect(msg.result).toContain('User3');
        expect(msg.result).not.toContain('User2');
        done();
      });

      socketWorker.postMessage({ action: 'filterUsers', payload });
    });
  });

  describe('fileWorker.js', () => {
    let fileWorker;

    beforeEach(() => {
      fileWorker = new Worker(path.join(__dirname, '../workers/fileWorker.js'));
    });

    afterEach(async () => {
      await fileWorker.terminate();
    });

    test('should process file and return success', (done) => {
      const fileData = {
        filename: '123-test.png',
        originalname: 'test.png',
        path: 'uploads/123-test.png'
      };

      fileWorker.on('message', (msg) => {
        expect(msg.success).toBe(true);
        expect(msg.filename).toBe('123-test.png');
        expect(msg).toHaveProperty('isSafe');
        done();
      });

      fileWorker.postMessage(fileData);
    }, 2000); // Darle tiempo al setTimeout de 1s
  });
});
