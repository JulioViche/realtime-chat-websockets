import { useState, useRef } from 'react'
import Input from '../atoms/Input'
import Button from '../atoms/Button'

const MessageForm = ({ onSendMessage, allowFiles = false }) => {
  const [newMessage, setNewMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const fileInputRef = useRef(null)

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim() && !selectedFile) return

    onSendMessage({ text: newMessage, file: selectedFile })
    setNewMessage('')
    setSelectedFile(null)
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
    }
  }

  return (
    <footer className="bg-white px-6 py-4 border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      {/* Vista previa del archivo adjunto seleccionado */}
      {selectedFile && (
        <div className="max-w-4xl mx-auto mb-3 flex items-center bg-blue-50 p-2 rounded-lg text-sm text-blue-700 border border-blue-100">
          <svg
            className="w-5 h-5 mr-2 opacity-70"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
            />
          </svg>
          <span className="truncate flex-1 font-medium">
            {selectedFile.name}
          </span>
          <button
            type="button"
            onClick={() => setSelectedFile(null)}
            className="ml-2 p-1 text-blue-500 hover:text-blue-800 hover:bg-blue-100 rounded-full transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        className="flex space-x-3 max-w-4xl mx-auto items-center"
      >
        {allowFiles && (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors focus:outline-none"
              title="Adjuntar archivo"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
            </button>
          </div>
        )}
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Escribe un mensaje..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
        </div>
        <div className="w-24 h-[42px]">
          <Button type="submit" text="Enviar" customClass="h-full" />
        </div>
      </form>
    </footer>
  )
}

export default MessageForm
