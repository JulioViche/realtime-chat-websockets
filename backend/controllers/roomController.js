const Room = require('../models/Room')
const UserSession = require('../models/UserSession')

const generatePin = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

exports.createRoom = async (req, res) => {
  try {
    const { name, type } = req.body

    if (!name) {
      return res
        .status(400)
        .json({ error: 'El nombre de la sala es obligatorio' })
    }

    const pin = generatePin()

    const newRoom = new Room({
      name,
      pin,
      type: type || 'TEXT', // Por defecto será TEXT si no envían nada
    })

    const savedRoom = await newRoom.save()

    res.status(201).json({
      message: 'Sala creada exitosamente',
      room: savedRoom,
    })
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Error al crear la sala', details: error.message })
  }
}

exports.joinRoom = async (req, res) => {
  try {
    const { pin, nickname, deviceId } = req.body
    // La IP la podemos obtener directamente de la petición (request) de Express
    const ipAddress = req.ip || req.connection.remoteAddress

    if (!pin || !nickname || !deviceId) {
      return res
        .status(400)
        .json({ error: 'Faltan datos obligatorios (pin, nickname, deviceId)' })
    }

    // Buscar la sala por PIN
    const room = await Room.findOne({ pin, isActive: true })

    if (!room) {
      return res.status(404).json({ error: 'Sala no encontrada o inactiva' })
    }

    // Opcional: Validar que el nickname no exista ya en la sala activa
    const existingSession = await UserSession.findOne({
      roomId: room._id,
      nickname,
      isActive: true,
    })
    if (existingSession) {
      return res
        .status(400)
        .json({ error: 'El nickname ya está en uso en esta sala' })
    }

    // Crear la sesión del usuario
    const newSession = new UserSession({
      roomId: room._id,
      deviceId,
      ipAddress,
      nickname,
    })

    const savedSession = await newSession.save()

    res.status(200).json({
      message: 'Te has unido a la sala',
      session: savedSession,
      roomType: room.type,
    })
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Error al unirse a la sala', details: error.message })
  }
}
