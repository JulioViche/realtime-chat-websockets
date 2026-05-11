const Room = require('../models/Room')
const Message = require('../models/Message')
const File = require('../models/File')
const Piscina = require('piscina')
const path = require('path')

// Pool de hilos persistente para operaciones de salas (bcrypt y generación de PIN)
const roomPool = new Piscina({
  filename: path.join(__dirname, '../workers/roomWorker.js')
})

exports.createRoom = async (req, res) => {
  try {
    const { name, type, pin } = req.body

    if (!name) {
      return res
        .status(400)
        .json({ error: 'El nombre de la sala es obligatorio' })
    }

    if (!pin || !/^\d{4,}$/.test(pin)) {
      return res
        .status(400)
        .json({ error: 'El PIN es obligatorio y debe tener al menos 4 dígitos numéricos' })
    }

    const pinFingerprint = Room.generatePinFingerprint(pin)
    const existingRoom = await Room.findOne({ pinFingerprint })
    if (existingRoom) {
      return res.status(409).json({ error: 'Ya existe una sala con ese PIN. Usa uno diferente.' })
    }

    const newRoom = new Room({
      name,
      pin,
      pinFingerprint,
      type: type || 'TEXT',
    })

    const savedRoom = await newRoom.save()

    res.status(201).json({
      message: 'Sala creada exitosamente',
      room: {
        _id: savedRoom._id,
        name: savedRoom.name,
        type: savedRoom.type,
        isActive: savedRoom.isActive
      },
    })
  } catch (error) {
    console.error('ERROR AL CREAR SALA:', error)
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Ya existe una sala con ese PIN. Usa uno diferente.' })
    }
    res
      .status(500)
      .json({ error: 'Error al crear la sala', details: error.message })
  }
}

exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find().select('-pin').sort({ createdAt: -1 })
    res.status(200).json(rooms)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las salas', details: error.message })
  }
}

exports.deleteRoom = async (req, res) => {
  try {
    const { id } = req.params
    const deletedRoom = await Room.findByIdAndDelete(id)

    if (!deletedRoom) {
      return res.status(404).json({ error: 'Sala no encontrada' })
    }

    // Opcional: También podríamos borrar los mensajes asociados si quisiéramos limpieza total
    await Message.deleteMany({ roomId: id })

    res.status(200).json({ message: 'Sala eliminada exitosamente' })
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la sala', details: error.message })
  }
}

exports.getRoomMessages = async (req, res) => {
  try {
    const { pin } = req.params

    // Como el PIN está encriptado, delegamos la comparación masiva al worker
    // Usamos .lean() para obtener objetos planos de JS que se serializan bien hacia el worker
    const rooms = await Room.find({ isActive: true }).select('_id pin type').lean()

    // Convert ObjectId to string before sending to worker to avoid DataCloneError
    const roomsForWorker = rooms.map((room) => ({
      ...room,
      _id: room._id?.toString()
    }))

    const roomMatched = await roomPool.run({
      action: 'verifyRoomPin',
      payload: { pin, rooms: roomsForWorker }
    })

    if (!roomMatched) {
      return res.status(404).json({ error: 'Sala no encontrada o PIN incorrecto' })
    }

    // Buscar mensajes de la sala
    const messages = await Message.find({ roomId: roomMatched._id }).sort({ createdAt: 1 })

    // Como algunos mensajes pueden tener archivos adjuntos, los buscamos
    // En MongoDB podemos hacer esto manualmente o con agregaciones. Lo haremos manualmente para que sea fácil de entender.
    const messagesWithFiles = await Promise.all(messages.map(async (msg) => {
      const msgObj = msg.toObject()
      
      if (msgObj.type === 'FILE') {
        const file = await File.findOne({ messageId: msg._id })
        if (file) {
          msgObj.file = {
            name: file.name,
            url: file.url,
            type: file.type
          }
        }
      }
      return msgObj
    }))

    res.status(200).json({
      roomType: roomMatched.type,
      messages: messagesWithFiles
    })
  } catch (error) {
    console.error('ERROR AL OBTENER MENSAJES:', error)
    res.status(500).json({ error: 'Error al obtener mensajes', details: error.message })
  }
}
