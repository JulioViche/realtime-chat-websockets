import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import axios from 'axios'
import Swal from 'sweetalert2'

import MessageForm from '../molecules/MessageForm'
import RoomHeader from '../molecules/RoomHeader'
import MessageBubble from '../molecules/MessageBubble'

const Room = () => {
  const { pin } = useParams()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [roomType, setRoomType] = useState('TEXT') // 'TEXT' o 'MULTIMEDIA'
  const [roomId, setRoomId] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState([])
  
  // Estados UI
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const socketRef = useRef(null)
  const myNickname = localStorage.getItem('userNickname')

  useEffect(() => {
    if (!myNickname) {
      navigate('/')
      return
    }

    // 1. Conectar Socket
    socketRef.current = io('http://localhost:3000')

    const attemptJoin = (usernameToUse, force = false) => {
      socketRef.current.emit(
        'joinRoom',
        { pin, user: usernameToUse, force },
        (response) => {
          if (response.error === 'session_conflict') {
            setLoading(false)
            Swal.fire({
              icon: 'warning',
              title: 'Sesión activa detectada',
              text: `Ya tienes una sesión activa en este dispositivo como "${response.existingUser}". ¿Deseas continuar en esta pestaña con ese usuario, o usar el nuevo nombre y cerrar la otra sesión?`,
              showCancelButton: true,
              showDenyButton: true,
              confirmButtonText: `Usar viejo (${response.existingUser})`,
              denyButtonText: `Usar nuevo (${usernameToUse})`,
              cancelButtonText: 'Cancelar',
              confirmButtonColor: '#3085d6',
              denyButtonColor: '#2563eb',
            }).then((result) => {
              if (result.isConfirmed) {
                // Toma control con el usuario viejo
                localStorage.setItem('userNickname', response.existingUser)
                window.location.reload()
              } else if (result.isDenied) {
                // Fuerza la conexión con el nuevo usuario
                setLoading(true)
                attemptJoin(usernameToUse, true)
              } else {
                handleLeaveRoom()
              }
            })
          } else if (response.error) {
            setLoading(false)
            Swal.fire({
              icon: 'error',
              title: 'Acceso Denegado',
              text: response.error,
              confirmButtonColor: '#2563eb'
            }).then(() => {
              handleLeaveRoom()
            })
          } else {
            setRoomType(response.roomType)
            setRoomId(response.roomId)
            // 3. Si tuvo éxito, cargar el historial de mensajes vía HTTP
            fetchHistory()
          }
        }
      )
    }

    // 2. Intentar unirse a la sala
    attemptJoin(myNickname, false)

    // 4. Escuchar nuevos mensajes en tiempo real
    socketRef.current.on('newMessage', (data) => {
      setMessages((prev) => [...prev, data])
    })

    // 5. Escuchar actualizaciones de la lista de usuarios
    socketRef.current.on('userListUpdate', (users) => {
      setOnlineUsers(users)
    })

    // 6. Escuchar desconexión forzada
    socketRef.current.on('force_disconnect', (msg) => {
      Swal.fire({
        icon: 'info',
        title: 'Sesión cerrada',
        text: msg,
        confirmButtonColor: '#2563eb'
      }).then(() => {
        handleLeaveRoom()
      })
    })

    // Limpieza al desmontar (cuando el usuario se va)
    return () => {
      socketRef.current.disconnect()
    }
  }, [pin, myNickname])

  // Función para obtener el historial
  const fetchHistory = async () => {
    try {
      const res = await axios.get(`/api/rooms/${pin}/messages`)
      setMessages(res.data.messages)
      setLoading(false)
    } catch (err) {
      setError('Error al cargar historial')
      setLoading(false)
    }
  }

  // Manejador del envío
  const handleSendMessage = async ({ text, file }) => {
    if (!roomId) return

    let fileData = null

    // Si hay archivo, lo subimos por Axios primero
    if (file) {
      const formData = new FormData()
      formData.append('file', file)

      try {
        const uploadRes = await axios.post('/api/upload', formData, {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            setUploadProgress(percentCompleted)
          },
        })

        // Cuando termina, limpiamos la barra y extraemos los datos
        setUploadProgress(0)
        fileData = {
          name: uploadRes.data.file.originalname,
          url: `http://localhost:3000${uploadRes.data.url}`,
          type: uploadRes.data.file.mimetype,
        }
      } catch (err) {
        console.error('Error subiendo archivo', err)
        alert('Hubo un error al subir tu archivo.')
        setUploadProgress(0)
        return // No enviar el mensaje si falló el archivo
      }
    }

    // Finalmente enviamos el mensaje al túnel de WebSockets
    const messagePayload = {
      roomId,
      content: text,
      file: fileData,
      // Nota: El Backend ignorará el nombre que le pasemos y usará el oficial de la RAM,
      // pero para mantener la forma lo enviamos o simplemente el Backend sabe.
    }

    socketRef.current.emit('sendMessage', messagePayload)
  }

  const handleLeaveRoom = () => {
    localStorage.removeItem('userNickname')
    window.location.href = '/'
  }

  // --- RENDERS DE ERROR O CARGA ---
  if (error) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gray-50">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Ups, algo salió mal</h2>
        <p className="mb-4 text-gray-700">{error}</p>
        <button
          onClick={handleLeaveRoom}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg"
        >
          Volver al Inicio
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-500">Conectando a la sala...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <RoomHeader
        roomName={`Sala PIN: ${pin}`}
        pin={pin}
        onlineCount={`${onlineUsers.length} conectados`}
        onLeave={handleLeaveRoom}
      />

      {/* Barra de Progreso global (opcional) */}
      {uploadProgress > 0 && (
        <div className="bg-blue-100 text-blue-800 text-sm py-1 px-4 text-center font-semibold">
          Subiendo archivo: {uploadProgress}%
        </div>
      )}

      {/* Sección de usuarios conectados */}
      <div className="bg-white border-b px-6 py-2 flex items-center space-x-2 overflow-x-auto no-scrollbar">
        <span className="text-xs font-bold text-gray-400 uppercase">En línea:</span>
        {onlineUsers.map((user, idx) => (
          <span 
            key={idx} 
            className={`text-sm px-2 py-0.5 rounded-full ${user === myNickname ? 'bg-blue-100 text-blue-700 font-bold' : 'bg-gray-100 text-gray-600'}`}
          >
            {user}
          </span>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <p className="text-center text-gray-400 mt-10">No hay mensajes aún. ¡Sé el primero!</p>
        ) : (
          messages.map((msg) => (
            <MessageBubble 
              key={msg._id} 
              msg={{
                ...msg,
                // El componente MessageBubble esperaba 'nickname' y 'isMine'
                nickname: msg.user,
                isMine: msg.user === myNickname,
                time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }} 
            />
          ))
        )}
      </main>

      <MessageForm
        onSendMessage={handleSendMessage}
        allowFiles={roomType === 'MULTIMEDIA'}
      />
    </div>
  )
}

export default Room
