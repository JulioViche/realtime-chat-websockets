const bcrypt = require('bcrypt')

module.exports = async ({ action, payload }) => {
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
