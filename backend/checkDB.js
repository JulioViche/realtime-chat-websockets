const mongoose = require('mongoose');
require('dotenv').config();
const Room = require('./models/Room');

async function checkRooms() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const rooms = await Room.find();
    console.log('Salas en la base de datos:', rooms);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkRooms();
