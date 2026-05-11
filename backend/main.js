const express = require('express')
const mongoose = require('mongoose')
const http = require('http')
const { Server } = require('socket.io')
const path = require('path')
const { Worker } = require('worker_threads')
const Piscina = require('piscina')
require('dotenv').config()

const app = express()
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Device-Id')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')

  if (req.method === 'OPTIONS') return res.sendStatus(204)
  return next()
})
app.use(express.json())

// Configurar carpeta pública para exponer los archivos subidos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

const authRoutes = require('./routes/authRoutes')
const roomRoutes = require('./routes/roomRoutes')
const uploadRoutes = require('./routes/uploadRoutes') // Volvemos a integrar rutas de subida

// Modelos necesarios para sincronizar índices
const Room = require('./models/Room')
const Admin = require('./models/Admin')

// Ya NO incluimos las rutas de sesiones (UserSession)
app.use('/api/auth', authRoutes)
app.use('/api/rooms', roomRoutes)
app.use('/api/upload', uploadRoutes)

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected')
    await Room.syncIndexes()
    await Admin.syncIndexes()
    await ensureDefaultAdmin()
    console.log('Índices sincronizados correctamente')
  })
  .catch((err) => console.error(err))

app.get('/', (req, res) => {
  res.send('API funcionando')
})

async function ensureDefaultAdmin() {
  const username = process.env.ADMIN_USER
  const password = process.env.ADMIN_PASS

  if (!username || !password) {
    console.warn('ADMIN_USER y ADMIN_PASS no están definidos; no se creó admin inicial.')
    return
  }

  const existingAdmin = await Admin.findOne({ username })
  if (existingAdmin) return

  await Admin.create({ username, password })
  console.log(`Admin inicial "${username}" creado con contraseña hasheada en MongoDB`)
}

// === CONFIGURACIÓN DE WEBSOCKETS (NUEVO ENFOQUE ULTRALIGERO) ===
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*', // Permitir conexión desde el Frontend
    methods: ['GET', 'POST']
  }
})

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

function getSocketDeviceId(socket) {
  return (
    socket.handshake.auth?.deviceId ||
    socket.handshake.headers['x-device-id'] ||
    socket.handshake.address
  )
}

function sanitizeText(value, maxLength = 2000) {
  return String(value || '')
    .trim()
    .replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]))
    .slice(0, maxLength)
}

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
      const cleanUser = sanitizeText(user, 40)
      if (!cleanUser) {
        if (callback) callback({ error: 'El nickname es obligatorio' })
        return
      }

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
      const deviceId = getSocketDeviceId(socket)
      console.log(`Intentando unir usuario: ${cleanUser} desde IP: ${userIp}, force: ${force}`)
      
      const roomIdStr = room._id.toString()

      // B. VALIDACIÓN EN HILO INDEPENDIENTE (Refactorizado a Worker Thread)
      const { existingSession, isDuplicateName } = await runSocketWorker('validateJoin', {
        usuarios: Array.from(usuariosConectados.entries()),
        socketId: socket.id,
        userIp,
        deviceId,
        roomId: roomIdStr,
        user: cleanUser
      })

      // Si hay conflicto de IP y NO se ha pedido forzar la entrada
      if (existingSession && !force && existingSession.user !== cleanUser) {
        if (callback) callback({ 
          error: 'session_conflict', 
          existingUser: existingSession.user 
        })
        return
      }

      // Si se pide forzar (o es la misma IP pero queremos cambiar/reusar) o es reconexión
      if (existingSession && (force || existingSession.user === cleanUser)) {
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
      if (isDuplicateName && (!existingSession || existingSession.user !== cleanUser)) {
        if (callback) callback({ error: 'El nombre ya está en uso en esta sala' })
        return
      }

      // C. Si todo está bien, lo unimos al túnel y lo guardamos en RAM
      socket.join(roomIdStr)
      usuariosConectados.set(socket.id, { user: cleanUser, roomId: roomIdStr, ip: userIp, deviceId })
      
      // Iniciar timer de inactividad
      resetInactivityTimer(socket)

      console.log(`Socket ${socket.id} (${cleanUser}) se unió a la sala ${pin} (Validado en Worker)`)
      
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

      const safeData = {
        ...data,
        content: sanitizeText(data.content),
      }

      if (!safeData.content && !safeData.file) {
        return
      }

      // Resetear timer de inactividad al enviar mensaje
      resetInactivityTimer(socket)

      let mensajeEmitir

      // REFACTORIZACIÓN: Si la carga es alta (> HIGH_LOAD_THRESHOLD), procesamos vía Worker Thread
      if (usuariosConectados.size > HIGH_LOAD_THRESHOLD) {
        console.log(`[Carga Alta] Procesando mensaje en Worker. Usuarios: ${usuariosConectados.size}`)
        mensajeEmitir = await runSocketWorker('processMessage', {
          messageData: safeData,
          user: session.user
        })
      } else {
        mensajeEmitir = { ...safeData, user: session.user }
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
      if (safeData.file) {
        const nuevoArchivo = new File({
          messageId: mensajeGuardado._id,
          name: safeData.file.name,
          url: safeData.file.url,
          type: safeData.file.type,
          size: safeData.file.size
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
  server.listen(PORT, '0.0.0.0', () => console.log(`Servidor (con Sockets) corriendo en puerto ${PORT} y accesible en toda la red`))
}

module.exports = { app, server, io, usuariosConectados, inactivityTimers }
