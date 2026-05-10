const { parentPort } = require('worker_threads')

module.exports = ({ action, payload }) => {
  if (action === 'validateJoin') {
    const { usuarios, socketId, userIp, roomId, user } = payload
    let existingSession = null
    let isDuplicateName = false

    for (const [id, val] of usuarios) {
      // 1. Validar si ya hay una sesión de esa IP en este cuarto
      if (val.ip === userIp && val.roomId === roomId && id !== socketId) {
        existingSession = { id, user: val.user, roomId: val.roomId }
        break
      }
      // 2. Validar si el nombre ya existe en este cuarto
      if (val.user === user && val.roomId === roomId && id !== socketId) {
        isDuplicateName = true
      }
    }
    return { existingSession, isDuplicateName }
  }

  if (action === 'filterUsers') {
    const { usuarios, roomId } = payload
    const lista = usuarios
      .filter(([id, val]) => val.roomId === roomId)
      .map(([id, val]) => val.user)
    return lista
  }

  if (action === 'processMessage') {
    const { messageData, user } = payload
    // Simular procesamiento pesado
    return { ...messageData, user, isWorkerProcessed: true }
  }

  return null
}
