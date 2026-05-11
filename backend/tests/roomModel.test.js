process.env.PIN_PEPPER = process.env.PIN_PEPPER || 'test_pepper_for_jest';

const Room = require('../models/Room');

const getPinSaveHook = () => {
  return Room.schema.s.hooks._pres
    .get('save')
    .find((hook) => hook.fn.toString().includes('pinFingerprint')).fn;
};

describe('Room Model - PIN security', () => {
  test('generatePinFingerprint creates deterministic fingerprints without exposing the PIN', () => {
    const firstFingerprint = Room.generatePinFingerprint('1234');
    const secondFingerprint = Room.generatePinFingerprint('1234');
    const differentFingerprint = Room.generatePinFingerprint('9999');

    expect(firstFingerprint).toBe(secondFingerprint);
    expect(firstFingerprint).not.toBe(differentFingerprint);
    expect(firstFingerprint).not.toContain('1234');
  });

  test('pre-save hook stores a bcrypt hash and an encrypted readable copy', async () => {
    const pinSaveHook = getPinSaveHook();
    const room = new Room({
      name: 'Sala segura',
      pin: '4321',
      type: 'TEXT',
    });

    await pinSaveHook.call(room);

    expect(room.pin).not.toBe('4321');
    expect(room.pin).toMatch(/^\$2[aby]\$/);
    expect(room.pinFingerprint).toBe(Room.generatePinFingerprint('4321'));
    expect(room.pinEncrypted).toContain(':');
    expect(Room.decryptPin(room.pinEncrypted)).toBe('4321');
    await expect(room.comparePin('4321')).resolves.toBe(true);
    await expect(room.comparePin('1111')).resolves.toBe(false);
  });

  test('pre-save hook skips the encrypted copy in maximum security mode', async () => {
    const pinSaveHook = getPinSaveHook();
    const room = new Room({
      name: 'Sala no recuperable',
      pin: '9876',
      pinSecurityMode: Room.PIN_SECURITY_MODES.NON_RECOVERABLE,
      type: 'TEXT',
    });

    await pinSaveHook.call(room);

    expect(room.pin).not.toBe('9876');
    expect(room.pin).toMatch(/^\$2[aby]\$/);
    expect(room.pinFingerprint).toBe(Room.generatePinFingerprint('9876'));
    expect(room.pinEncrypted).toBeUndefined();
    await expect(room.comparePin('9876')).resolves.toBe(true);
  });

  test('pre-save hook does nothing when the PIN was not modified', async () => {
    const pinSaveHook = getPinSaveHook();
    const room = Room.hydrate({
      name: 'Sala existente',
      pin: 'hashed-pin',
      pinFingerprint: 'existing-fingerprint',
      pinEncrypted: 'existing-encrypted',
      type: 'TEXT',
    });

    await pinSaveHook.call(room);

    expect(room.pin).toBe('hashed-pin');
    expect(room.pinFingerprint).toBe('existing-fingerprint');
    expect(room.pinEncrypted).toBe('existing-encrypted');
  });

  test('decryptPin returns null when there is no encrypted PIN or the format is invalid', () => {
    expect(Room.decryptPin()).toBeNull();
    expect(Room.decryptPin('bad-format')).toBeNull();
  });
});
