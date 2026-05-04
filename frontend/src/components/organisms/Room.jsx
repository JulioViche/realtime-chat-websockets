import { useState } from 'react'
import MessageForm from '../molecules/MessageForm'
import RoomHeader from '../molecules/RoomHeader'
import MessageBubble from '../molecules/MessageBubble'

const Room = () => {
  // Datos simulados (mocks) para que puedas ver el diseño sin conectar al backend todavía
  const [messages, setMessages] = useState([
    {
      _id: '1',
      nickname: 'Sistema',
      content: 'Bienvenido a la Sala General',
      isMine: false,
      time: '10:00 AM',
    },
    {
      _id: '2',
      nickname: 'NinjaGamer',
      content: '¡Hola a todos!',
      isMine: false,
      time: '10:01 AM',
    },
    {
      _id: '3',
      nickname: 'Tú',
      content: 'Hola Ninja, ¿cómo estás?',
      isMine: true,
      time: '10:02 AM',
    },
  ])

  const handleSendMessage = (text) => {
    const newMsg = {
      _id: Date.now().toString(),
      nickname: 'Tú',
      content: text,
      isMine: true,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }

    setMessages([...messages, newMsg])
  }

  const handleLeaveRoom = () => {
    // Redirigir al inicio (simulando salida)
    window.location.href = '/'
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header del Chat */}
      <RoomHeader
        roomName="Sala General"
        pin="123456"
        onlineCount={5}
        onLeave={handleLeaveRoom}
      />

      {/* Área de Mensajes */}
      <main className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <MessageBubble key={msg._id} msg={msg} />
        ))}
      </main>

      {/* Footer / Barra para escribir factorizada */}
      <MessageForm onSendMessage={handleSendMessage} />
    </div>
  )
}

export default Room
