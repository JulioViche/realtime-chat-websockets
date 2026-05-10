const express = require('express')
const mongoose = require('mongoose')
const http = require('http')
const { Server } = require('socket.io')
const path = require('path')
require('dotenv').config()

const app = express()
app.use(express.json())

// Configurar carpeta pública para exponer los archivos subidos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

const authRoutes = require('./routes/authRoutes')
const roomRoutes = require('./routes/roomRoutes')
const uploadRoutes = require('./routes/uploadRoutes') // Volvemos a integrar rutas de subida

// Ya NO incluimos las rutas de sesiones (UserSession)
app.use('/api/auth', authRoutes)
app.use('/api/rooms', roomRoutes)
app.use('/api/upload', uploadRoutes)

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error(err))

app.get('/', (req, res) => {
  res.send('API funcionando')
})

// === CONFIGURACIÓN DE WEBSOCKETS (NUEVO ENFOQUE ULTRALIGERO) ===
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*', // Permitir conexión desde el Frontend
    methods: ['GET', 'POST']
  }
})

const Room = require('./models/Room')
const Message = require('./models/Message')
const File = require('./models/File') // Por si hay mensajes con archivos

// 💡 DICCIONARIO EN RAM: socket.id -> { user, roomId }
const usuariosConectados = new Map()

// Lógica de Sockets
io.on('connection', (socket) => {
  console.log('Un usuario se ha conectado:', socket.id)

  // 1. Cuando el usuario intenta entrar a la sala
  socket.on('joinRoom', async ({ pin, user }, callback) => {
    try {
      // A. Validar que la sala exista en BD
      const room = await Room.findOne({ pin, isActive: true })
      if (!room) {
        if (callback) callback({ error: 'Sala no encontrada o inactiva' })
        return
      }

      // B. Validar que el nombre (user) no esté siendo usado en esa misma sala
      // Y validar que no haya otra sesión activa desde la misma IP (Requisito 3.1.3)
      const userIp = socket.handshake.address
      let isDuplicateName = false
      let isDuplicateIp = false

      usuariosConectados.forEach((val) => {
        if (val.roomId === room._id.toString()) {
          if (val.user === user) isDuplicateName = true
        }
        if (val.ip === userIp) isDuplicateIp = true
      })

      if (isDuplicateName) {
        if (callback) callback({ error: 'El nombre ya está en uso en esta sala' })
        return
      }

      if (isDuplicateIp) {
        if (callback) callback({ error: 'Ya tienes una sesión activa desde este dispositivo' })
        return
      }

      // C. Si todo está bien, lo unimos al túnel y lo guardamos en RAM
      const roomIdStr = room._id.toString()
      socket.join(roomIdStr)
      usuariosConectados.set(socket.id, { user, roomId: roomIdStr, ip: userIp })
      
      console.log(`Socket ${socket.id} (${user}) se unió a la sala ${pin}`)
      
      // Enviar lista actualizada de usuarios a todos en la sala
      enviarListaUsuarios(roomIdStr)

      // Respondemos con éxito para que React lo deje entrar visualmente
      if (callback) callback({ success: true, roomType: room.type, roomId: roomIdStr })

    } catch (error) {
      if (callback) callback({ error: 'Error del servidor' })
    }
  })

  // 2. Cuando el usuario escribe un mensaje
  socket.on('sendMessage', async (data) => {
    try {
      // Validamos si el socket existe en nuestra RAM
      const session = usuariosConectados.get(socket.id)
      if (!session || session.roomId !== data.roomId) {
        return // Ignorar el mensaje si es un intruso que no pasó por joinRoom
      }

      // Guardar el mensaje en Mongo
      const nuevoMensaje = new Message({
        roomId: data.roomId,
        user: session.user, // Lo sacamos de la RAM, no de lo que mande el frontend (más seguro)
        content: data.content,
        type: data.file ? 'FILE' : 'TEXT'
      })
      const mensajeGuardado = await nuevoMensaje.save()

      // Guardar el archivo en Mongo si existe
      if (data.file) {
        const nuevoArchivo = new File({
          messageId: mensajeGuardado._id,
          name: data.file.name,
          url: data.file.url,
          type: data.file.type
        })
        await nuevoArchivo.save()
      }

      // Emitir el mensaje final a toda la sala
      const mensajeEmitir = { ...data, _id: mensajeGuardado._id, user: session.user }
      io.to(data.roomId).emit('newMessage', mensajeEmitir)

    } catch (error) {
      console.error('Error guardando mensaje:', error)
    }
  })

  // 3. Cuando el usuario cierra la pestaña o pierde WiFi
  socket.on('disconnect', () => {
    const session = usuariosConectados.get(socket.id)
    if (session) {
      const roomIdStr = session.roomId
      // Borramos su nombre de la memoria RAM automáticamente
      usuariosConectados.delete(socket.id)
      console.log('Usuario desconectado y limpiado de memoria:', socket.id)
      
      // Notificar a los demás que la lista cambió
      enviarListaUsuarios(roomIdStr)
    }
  })
})

// Función auxiliar para obtener y enviar la lista de usuarios de una sala
function enviarListaUsuarios(roomId) {
  const lista = []
  usuariosConectados.forEach((val) => {
    if (val.roomId === roomId) {
      lista.push(val.user)
    }
  })
  io.to(roomId).emit('userListUpdate', lista)
}

const PORT = process.env.PORT || 3000
// ATENCIÓN: Ahora levantamos 'server', no 'app'
server.listen(PORT, () => console.log(`Servidor (con Sockets) corriendo en puerto ${PORT}`))
