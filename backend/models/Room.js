const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const PIN_PEPPER = process.env.PIN_PEPPER;
const PIN_SECURITY_MODES = {
  RECOVERABLE: 'RECOVERABLE',
  NON_RECOVERABLE: 'NON_RECOVERABLE',
};

if (!PIN_PEPPER) {
  console.error('❌ ERROR FATAL: La variable PIN_PEPPER no está definida en el archivo .env');
  process.exit(1);
}

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    pin: {
      type: String,
      required: true,
    },
    pinFingerprint: {
      type: String,
      unique: true,
      sparse: true,
    },
    pinEncrypted: {
      type: String,
      select: false,
    },
    pinSecurityMode: {
      type: String,
      enum: Object.values(PIN_SECURITY_MODES),
      default: PIN_SECURITY_MODES.RECOVERABLE,
      required: true,
    },
    type: {
      type: String,
      enum: ['TEXT', 'MULTIMEDIA'],
      default: 'TEXT',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

function generatePinFingerprint(plainPin) {
  return crypto.createHmac('sha256', PIN_PEPPER).update(plainPin).digest('hex');
}

function getPinEncryptionKey() {
  return crypto.createHash('sha256').update(PIN_PEPPER).digest();
}

function encryptPin(plainPin) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getPinEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plainPin, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted.toString('hex'),
  ].join(':');
}

function decryptPin(encryptedPin) {
  if (!encryptedPin) return null;

  const [ivHex, authTagHex, encryptedHex] = encryptedPin.split(':');
  if (!ivHex || !authTagHex || !encryptedHex) return null;

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getPinEncryptionKey(),
    Buffer.from(ivHex, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final(),
  ]).toString('utf8');
}

// Generar huella determinista del PIN para detectar duplicados sin almacenar el PIN en plano
roomSchema.statics.generatePinFingerprint = generatePinFingerprint;
roomSchema.statics.decryptPin = decryptPin;
roomSchema.statics.PIN_SECURITY_MODES = PIN_SECURITY_MODES;

// Middleware para encriptar el PIN antes de guardar
roomSchema.pre('save', async function () {
  if (!this.isModified('pin')) return;
  this.pinFingerprint = generatePinFingerprint(this.pin);
  this.pinEncrypted =
    this.pinSecurityMode === PIN_SECURITY_MODES.NON_RECOVERABLE
      ? undefined
      : encryptPin(this.pin);
  const salt = await bcrypt.genSalt(10);
  this.pin = await bcrypt.hash(this.pin, salt);
});

// Método para comparar el PIN ingresado con el encriptado
roomSchema.methods.comparePin = async function (candidatePin) {
  return await bcrypt.compare(candidatePin, this.pin);
};

module.exports = mongoose.model('Room', roomSchema);
