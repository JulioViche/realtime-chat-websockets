const UserSession = require('../models/UserSession')

// Obtener todas las sesiones activas en una sala (útil para mostrar quién está conectado)
exports.getActiveSessionsInRoom = async (req, res) => {
  try {
    const { roomId } = req.params

    const activeSessions = await UserSession.find({
      roomId,
      isActive: true,
    }).select('-ipAddress') // Ocultamos la IP por privacidad

    res.status(200).json(activeSessions)
  } catch (error) {
    res.status(500).json({
      error: 'Error al obtener las sesiones activas',
      details: error.message,
    })
  }
}

// Actualizar la última actividad del usuario (Heartbeat)
exports.updateActivity = async (req, res) => {
  try {
    const { sessionId } = req.params

    const session = await UserSession.findByIdAndUpdate(
      sessionId,
      { lastActivity: Date.now() },
      { new: true },
    )

    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada' })
    }

    res.status(200).json({ message: 'Actividad actualizada', session })
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Error al actualizar actividad', details: error.message })
  }
}

// Marcar la sesión como inactiva (cuando el usuario sale de la sala)
exports.leaveRoom = async (req, res) => {
  try {
    const { sessionId } = req.params

    const session = await UserSession.findByIdAndUpdate(
      sessionId,
      { isActive: false, lastActivity: Date.now() },
      { new: true },
    )

    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada' })
    }

    res
      .status(200)
      .json({ message: 'El usuario ha salido de la sala', session })
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Error al salir de la sala', details: error.message })
  }
}
