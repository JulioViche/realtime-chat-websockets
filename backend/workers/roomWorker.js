const bcrypt = require('bcrypt')
const crypto = require('crypto')

module.exports = async ({ action, payload }) => {
  if (action === 'generatePin') {
    return crypto.randomInt(0, 1000000).toString().padStart(6, '0')
  }

  if (action === 'verifyRoomPin') {
    const { pin, rooms } = payload
    
    if (!pin || !rooms || !Array.isArray(rooms)) {
      return null
    }
    
    for (const r of rooms) {
      // Validar que el PIN de la sala existe antes de comparar
      if (!r.pin) continue;
      
      try {
        const isMatch = await bcrypt.compare(pin, r.pin)
        if (isMatch) {
          return r
        }
      } catch (err) {
        console.error('Error comparing bcrypt:', err)
        continue
      }
    }
    return null
  }

  return null
}
