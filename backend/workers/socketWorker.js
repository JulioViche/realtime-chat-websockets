const { parentPort } = require('worker_threads')

parentPort.on('message', (task) => {
  const { action, payload } = task

  if (action === 'validateJoin') {
    const { usuarios, socketId, userIp, roomId, user } = payload
    let existingSession = null
    let isDuplicateName = false

    // usuarios is an array of [id, {user, roomId, ip}]
    for (const [id, val] of usuarios) {
      if (id === socketId) continue

      if (val.ip === userIp) {
        existingSession = { id, user: val.user, roomId: val.roomId }
      }

      if (val.roomId === roomId && val.user === user) {
        isDuplicateName = true
      }
    }
    parentPort.postMessage({
      action: 'validateJoinResult',
      result: { existingSession, isDuplicateName },
    })
  }

  if (action === 'filterUsers') {
    const { usuarios, roomId } = payload
    const lista = usuarios
      .filter(([id, val]) => val.roomId === roomId)
      .map(([id, val]) => val.user)
    parentPort.postMessage({ action: 'filterUsersResult', result: lista })
  }
})
