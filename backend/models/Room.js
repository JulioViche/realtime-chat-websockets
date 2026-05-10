const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

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
      unique: true,
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

// Middleware para encriptar el PIN antes de guardar
roomSchema.pre('save', async function (next) {
  if (!this.isModified('pin')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.pin = await bcrypt.hash(this.pin, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar el PIN ingresado con el encriptado
roomSchema.methods.comparePin = async function (candidatePin) {
  return await bcrypt.compare(candidatePin, this.pin);
};

module.exports = mongoose.model('Room', roomSchema);
