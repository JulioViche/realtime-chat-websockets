import { useState } from 'react'
import Input from '../atoms/Input'
import Button from '../atoms/Button'

const MessageForm = ({ onSendMessage }) => {
  const [newMessage, setNewMessage] = useState('')

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    // Llamamos a la función del padre y limpiamos nuestro estado local
    onSendMessage(newMessage)
    setNewMessage('')
  }

  return (
    <footer className="bg-white px-6 py-4 border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <form
        onSubmit={handleSendMessage}
        className="flex space-x-3 max-w-4xl mx-auto"
      >
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Escribe un mensaje..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
        </div>
        <div className="w-24">
          <Button type="submit" text="Enviar" customClass="h-full" />
        </div>
      </form>
    </footer>
  )
}

export default MessageForm
