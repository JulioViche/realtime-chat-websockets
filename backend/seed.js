const mongoose = require('mongoose')
require('dotenv').config()

const Room = require('./models/Room')
const Message = require('./models/Message')
const File = require('./models/File')

const seedDatabase = async () => {
  try {
    // 1. Conectar a la base de datos
    await mongoose.connect(process.env.MONGO_URI)
    console.log('🔌 Conectado a MongoDB para el seed...')

    // 2. Limpiar las colecciones actuales (opcional, útil para evitar duplicados en desarrollo)
    await Room.deleteMany({})
    await Message.deleteMany({})
    await File.deleteMany({})
    console.log('🗑️  Colecciones antiguas limpiadas.')

    // 3. Crear Salas (Rooms) iniciales
    const room1 = new Room({
      name: 'Sala General',
      pin: '123456', // PIN fácil para pruebas
      type: 'TEXT',
    })

    const room2 = new Room({
      name: 'Sala de Memes',
      pin: 'MEMES1',
      type: 'MULTIMEDIA',
    })

    await room1.save()
    await room2.save()
    console.log('🏠 Salas creadas.')

    // 4. Crear Mensajes (Message) y Archivos (File) de prueba
    const msg1 = new Message({
      roomId: room1._id,
      user: 'Julio_Dev',
      content: '¡Hola a todos en la Sala General!',
      type: 'TEXT',
    })

    const msg2 = new Message({
      roomId: room2._id,
      user: 'Meme_Lord',
      content: '¡Miren este meme que encontré!',
      type: 'TEXT',
    })

    const msg3 = new Message({
      roomId: room2._id,
      user: 'Meme_Lord',
      content: 'Archivo adjunto: meme_gato.jpg',
      type: 'FILE',
    })

    await msg1.save()
    await msg2.save()
    await msg3.save()

    // 6. Asociar el archivo al mensaje de tipo FILE
    const file1 = new File({
      messageId: msg3._id,
      name: 'meme_gato.jpg',
      url: 'https://example.com/uploads/meme_gato.jpg',
      type: 'image/jpeg',
      size: 102450, // 100 KB
    })

    await file1.save()

    console.log('💬 Mensajes y archivos de prueba creados.')

    console.log('✅ ¡Seed completado con éxito!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error ejecutando el seed:', error)
    process.exit(1)
  }
}

seedDatabase()
