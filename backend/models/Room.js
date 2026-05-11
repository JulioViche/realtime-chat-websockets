const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const PIN_PEPPER = process.env.PIN_PEPPER || 'default-pepper-cambiar-en-produccion';

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

// Generar huella determinista del PIN para detectar duplicados sin almacenar el PIN en plano
roomSchema.statics.generatePinFingerprint = generatePinFingerprint;

// Middleware para encriptar el PIN antes de guardar
roomSchema.pre('save', async function () {
  if (!this.isModified('pin')) return;
  this.pinFingerprint = generatePinFingerprint(this.pin);
  const salt = await bcrypt.genSalt(10);
  this.pin = await bcrypt.hash(this.pin, salt);
});

// Método para comparar el PIN ingresado con el encriptado
roomSchema.methods.comparePin = async function (candidatePin) {
  return await bcrypt.compare(candidatePin, this.pin);
};

module.exports = mongoose.model('Room', roomSchema);
