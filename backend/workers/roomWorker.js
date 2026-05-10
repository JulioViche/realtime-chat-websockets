const bcrypt = require('bcrypt')

module.exports = async ({ action, payload }) => {
  if (action === 'generatePin') {
    // Generar un PIN numérico de 6 dígitos
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  if (action === 'verifyRoomPin') {
    const { pin, rooms } = payload
    // rooms es un array de objetos con { _id, pin (hash) }
    
    for (const r of rooms) {
      const isMatch = await bcrypt.compare(pin, r.pin)
      if (isMatch) {
        return r // Retorna el objeto de la sala que coincidió
      }
    }
    return null
  }

  return null
}
