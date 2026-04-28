const mongoose = require('mongoose');

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

module.exports = mongoose.model('Room', roomSchema);
