import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import axios from 'axios'
import Swal from 'sweetalert2'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faComments, faUser } from '@fortawesome/free-solid-svg-icons'

import MessageForm from '../molecules/MessageForm'
import MessageBubble from '../molecules/MessageBubble'
import RoomHeader from '../molecules/RoomHeader'

const getSocketUrl = () => {
  const envSocketUrl = import.meta.env.VITE_SOCKET_URL
  if (envSocketUrl && envSocketUrl !== 'auto') return envSocketUrl

  if (typeof window === 'undefined') return 'http://localhost:3000'

  return `${window.location.protocol}//${window.location.hostname}:3000`
}

const SOCKET_URL = getSocketUrl()

const Room = () => {
  const { pin } = useParams()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [roomType, setRoomType] = useState('TEXT')
  const [roomId, setRoomId] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const socketRef = useRef(null)
  const myNickname = localStorage.getItem('userNickname')

  const handleLeaveRoom = useCallback(() => {
    localStorage.removeItem('userNickname')
    navigate('/')
  }, [navigate])

  const fetchHistory = useCallback(async () => {
    try {
      const response = await axios.get(`/api/rooms/${pin}/messages`)
      setRoomType(response.data.roomType?.toUpperCase() || 'TEXT')
      setMessages(response.data.messages)
    } catch {
      setError('Error al cargar historial')
    } finally {
      setLoading(false)
    }
  }, [pin])

  useEffect(() => {
    if (!myNickname) {
      navigate('/')
      return undefined
    }

    socketRef.current = io(SOCKET_URL)

    const attemptJoin = (usernameToUse, force = false) => {
      socketRef.current.emit(
        'joinRoom',
        { pin, user: usernameToUse, force },
        (response) => {
          if (response.error === 'session_conflict') {
            setLoading(false)
            Swal.fire({
              icon: 'question',
              title: 'Sesión activa',
              text: `Ya existe una sesión como "${response.existingUser}" en este dispositivo.`,
              showCancelButton: true,
              showDenyButton: true,
              confirmButtonText: `Continuar como "${response.existingUser}"`,
              denyButtonText: `Entrar como "${usernameToUse}"`,
              cancelButtonText: 'Volver al inicio',
              confirmButtonColor: '#0f766e',
              denyButtonColor: '#d97706',
              cancelButtonColor: '#dc2626',
            }).then((result) => {
              if (result.isConfirmed) {
                localStorage.setItem('userNickname', response.existingUser)
                window.location.reload()
                return
              }

              if (result.isDenied) {
                setLoading(true)
                attemptJoin(usernameToUse, true)
                return
              }

              handleLeaveRoom()
            })
            return
          }

          if (response.error) {
            setLoading(false)
            Swal.fire({
              icon: 'error',
              title: 'No pudimos dejarte entrar',
              text: response.error,
              confirmButtonText: 'Volver al inicio',
              confirmButtonColor: '#0f766e',
            }).then(handleLeaveRoom)
            return
          }

          setRoomType(response.roomType?.toUpperCase() || 'TEXT')
          setRoomId(response.roomId)
          fetchHistory()
        },
      )
    }

    attemptJoin(myNickname, false)

    socketRef.current.on('newMessage', (data) => {
      setMessages((prevMessages) => [...prevMessages, data])
    })

    socketRef.current.on('userListUpdate', (users) => {
      setOnlineUsers(users)
    })

    socketRef.current.on('force_disconnect', () => {
      Swal.fire({
        icon: 'info',
        title: 'Sesión movida',
        text: 'Tu sesión fue cerrada porque ingresaste desde otra pestaña.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#0f766e',
      }).then(handleLeaveRoom)
    })

    socketRef.current.on('inactivity_timeout', (message) => {
      Swal.fire({
        icon: 'warning',
        title: 'Sesión expirada',
        text: message,
        confirmButtonText: 'Volver al inicio',
        confirmButtonColor: '#0f766e',
      }).then(handleLeaveRoom)
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [fetchHistory, handleLeaveRoom, myNickname, navigate, pin])

  const handleSendMessage = async ({ text, file }) => {
    if (!roomId) return

    let fileData = null

    if (file) {
      const formData = new FormData()
      formData.append('file', file)

      try {
        const uploadResponse = await axios.post('/api/upload', formData, {
          onUploadProgress: (progressEvent) => {
            if (!progressEvent.total) return

            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            )
            setUploadProgress(percentCompleted)
          },
        })

        fileData = {
          name: uploadResponse.data.file.originalname,
          url: `${SOCKET_URL}${uploadResponse.data.url}`,
          type: uploadResponse.data.file.mimetype,
          size: uploadResponse.data.file.size,
        }
      } catch (uploadError) {
        const errorMessage =
          uploadError.response?.data?.error ||
          'Hubo un error al subir tu archivo.'

        Swal.fire({
          icon: 'error',
          title: 'Error al subir archivo',
          text: errorMessage,
          confirmButtonColor: '#0f766e',
        })
        return
      } finally {
        setUploadProgress(0)
      }
    }

    socketRef.current?.emit('sendMessage', {
      roomId,
      content: text,
      file: fileData,
    })
  }

  if (error) {
    return (
      <div className="loading-state px-4 text-center">
        <div>
          <FontAwesomeIcon
            icon={faComments}
            className="mb-4 text-4xl text-[var(--color-danger)]"
          />
          <h2 className="text-2xl font-black text-[var(--color-heading)]">
            Algo salió mal
          </h2>
          <p className="mt-2 text-[var(--color-muted)]">{error}</p>
          <button
            type="button"
            onClick={handleLeaveRoom}
            className="btn btn-primary mt-6"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="loading-state">
        <div>
          <div className="spinner mx-auto" />
          <p className="mt-4 font-bold">Conectando a la sala...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-shell">
      <RoomHeader
        roomName={`Sala ${pin}`}
        pin={pin}
        onlineCount={`${onlineUsers.length} conectados`}
        onLeave={handleLeaveRoom}
      />

      {uploadProgress > 0 && (
        <div className="upload-progress">
          <div
            className="progress-bar"
            style={{ width: `${uploadProgress}%` }}
          />
          <p className="py-2 text-center text-sm font-black">
            Subiendo archivo: {uploadProgress}%
          </p>
        </div>
      )}

      <section className="online-strip" aria-label="Usuarios conectados">
        <div className="online-strip-inner no-scrollbar">
          <span className="mr-1 flex items-center gap-2 text-xs font-black uppercase text-[var(--color-subtle)]">
            <FontAwesomeIcon icon={faUser} />
            En línea
          </span>
          {onlineUsers.map((user) => (
            <span
              key={user}
              className={`user-pill ${user === myNickname ? 'me' : ''}`}
            >
              {user}
            </span>
          ))}
        </div>
      </section>

      <main className="message-scroller">
        <div className="message-stack">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div>
                <FontAwesomeIcon
                  icon={faComments}
                  className="mb-4 text-3xl text-[var(--color-primary)]"
                />
                <p className="font-bold">No hay mensajes todavía.</p>
                <p className="mt-1 text-sm">Envía el primero desde abajo.</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message._id}
                msg={{
                  ...message,
                  nickname: message.user,
                  isMine: message.user === myNickname,
                  time: new Date(
                    message.createdAt || Date.now(),
                  ).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                }}
              />
            ))
          )}
        </div>
      </main>

      <MessageForm
        onSendMessage={handleSendMessage}
        allowFiles={roomType === 'MULTIMEDIA'}
      />
    </div>
  )
}

export default Room
