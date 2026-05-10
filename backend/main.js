const express = require('express')
const mongoose = require('mongoose')
const http = require('http')
const { Server } = require('socket.io')
const path = require('path')
const { Worker } = require('worker_threads')
const Piscina = require('piscina')
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
// DICCIONARIO PARA TIMEOUTS: socket.id -> timerId
const inactivityTimers = new Map()
const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutos
const HIGH_LOAD_THRESHOLD = 5 // Umbral para activar procesamiento en Worker

// Pool de hilos persistente para operaciones de Sockets
const socketPool = new Piscina({
  filename: path.join(__dirname, 'workers/socketWorker.js')
})

// Función auxiliar para ejecutar tareas en el pool de hilos persistente
async function runSocketWorker(action, payload) {
  try {
    return await socketPool.run({ action, payload })
  } catch (error) {
    console.error('Error in socketPool:', error)
    throw error
  }
}

// Función para gestionar el timeout por inactividad
function resetInactivityTimer(socket) {
  // Limpiar timer anterior si existe
  if (inactivityTimers.has(socket.id)) {
    clearTimeout(inactivityTimers.get(socket.id))
  }

  // Establecer nuevo timer
  const timerId = setTimeout(() => {
    console.log(`Socket ${socket.id} desconectado por inactividad`)
    socket.emit('inactivity_timeout', 'Has sido desconectado por inactividad prolongada.')
    socket.disconnect(true)
  }, INACTIVITY_TIMEOUT)

  inactivityTimers.set(socket.id, timerId)
}

// Lógica de Sockets
io.on('connection', (socket) => {
  console.log('Un usuario se ha conectado:', socket.id)

  // 1. Cuando el usuario intenta entrar a la sala
  socket.on('joinRoom', async ({ pin, user, force }, callback) => {
    try {
      // A. Validar que la sala exista en BD (Ahora con PIN encriptado)
      // Como el PIN está hasheado, no podemos buscarlo directamente.
      // Buscamos todas las salas activas y comparamos el PIN.
      const rooms = await Room.find({ isActive: true })
      let room = null
      
      for (const r of rooms) {
        const isMatch = await r.comparePin(pin)
        if (isMatch) {
          room = r
          break
        }
      }

      if (!room) {
        if (callback) callback({ error: 'Sala no encontrada o PIN incorrecto' })
        return
      }

      const userIp = socket.handshake.address
      console.log(`Intentando unir usuario: ${user} desde IP: ${userIp}, force: ${force}`)
      
      const roomIdStr = room._id.toString()

      // B. VALIDACIÓN EN HILO INDEPENDIENTE (Refactorizado a Worker Thread)
      const { existingSession, isDuplicateName } = await runSocketWorker('validateJoin', {
        usuarios: Array.from(usuariosConectados.entries()),
        socketId: socket.id,
        userIp,
        roomId: roomIdStr,
        user
      })

      // Si hay conflicto de IP y NO se ha pedido forzar la entrada
      if (existingSession && !force && existingSession.user !== user) {
        if (callback) callback({ 
          error: 'session_conflict', 
          existingUser: existingSession.user 
        })
        return
      }

      // Si se pide forzar (o es la misma IP pero queremos cambiar/reusar) o es reconexión
      if (existingSession && (force || existingSession.user === user)) {
        const oldSocket = io.sockets.sockets.get(existingSession.id)
        if (oldSocket) {
          oldSocket.emit('force_disconnect', 'Se ha iniciado sesión en otra pestaña.')
          oldSocket.disconnect(true)
        }
        usuariosConectados.delete(existingSession.id)
        // Notificar cambio de la sala de la sesión vieja si es distinta
        if (existingSession.roomId !== roomIdStr) {
           enviarListaUsuarios(existingSession.roomId)
        }
      }

      // Validar nombre duplicado
      if (isDuplicateName && (!existingSession || existingSession.user !== user)) {
        if (callback) callback({ error: 'El nombre ya está en uso en esta sala' })
        return
      }

      // C. Si todo está bien, lo unimos al túnel y lo guardamos en RAM
      socket.join(roomIdStr)
      usuariosConectados.set(socket.id, { user, roomId: roomIdStr, ip: userIp })
      
      // Iniciar timer de inactividad
      resetInactivityTimer(socket)

      console.log(`Socket ${socket.id} (${user}) se unió a la sala ${pin} (Validado en Worker)`)
      
      // Enviar lista actualizada de usuarios a todos en la sala
      enviarListaUsuarios(roomIdStr)

      // Respondemos con éxito para que React lo deje entrar visualmente
      if (callback) callback({ success: true, roomType: room.type, roomId: roomIdStr })

    } catch (error) {
      console.error('Error en joinRoom:', error)
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

      // Resetear timer de inactividad al enviar mensaje
      resetInactivityTimer(socket)

      let mensajeEmitir

      // REFACTORIZACIÓN: Si la carga es alta (> HIGH_LOAD_THRESHOLD), procesamos vía Worker Thread
      if (usuariosConectados.size > HIGH_LOAD_THRESHOLD) {
        console.log(`[Carga Alta] Procesando mensaje en Worker. Usuarios: ${usuariosConectados.size}`)
        mensajeEmitir = await runSocketWorker('processMessage', {
          messageData: data,
          user: session.user
        })
      } else {
        mensajeEmitir = { ...data, user: session.user }
      }

      // Guardar el mensaje en Mongo
      const nuevoMensaje = new Message({
        roomId: mensajeEmitir.roomId,
        user: mensajeEmitir.user,
        content: mensajeEmitir.content,
        type: mensajeEmitir.file ? 'FILE' : 'TEXT'
      })
      const mensajeGuardado = await nuevoMensaje.save()
      mensajeEmitir._id = mensajeGuardado._id

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
      io.to(mensajeEmitir.roomId).emit('newMessage', mensajeEmitir)

    } catch (error) {
      console.error('Error enviando mensaje:', error)
    }
  })

  // 3. Cuando el usuario cierra la pestaña o pierde WiFi
  socket.on('disconnect', () => {
    const session = usuariosConectados.get(socket.id)
    
    // Limpiar timer de inactividad
    if (inactivityTimers.has(socket.id)) {
      clearTimeout(inactivityTimers.get(socket.id))
      inactivityTimers.delete(socket.id)
    }

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

// Función auxiliar para obtener y enviar la lista de usuarios de una sala (Usa Worker Thread)
async function enviarListaUsuarios(roomId) {
  try {
    const lista = await runSocketWorker('filterUsers', {
      usuarios: Array.from(usuariosConectados.entries()),
      roomId
    })
    io.to(roomId).emit('userListUpdate', lista)
  } catch (error) {
    console.error('Error en enviarListaUsuarios:', error)
  }
}

const PORT = process.env.PORT || 3000
// ATENCIÓN: Ahora levantamos 'server', no 'app'
if (require.main === module) {
  server.listen(PORT, () => console.log(`Servidor (con Sockets) corriendo en puerto ${PORT}`))
}

module.exports = { app, server, io, usuariosConectados, inactivityTimers }
