import { useRef, useState } from 'react'
import Swal from 'sweetalert2'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPaperclip,
  faPaperPlane,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import Input from '../atoms/Input'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'application/pdf',
]

const MessageForm = ({ onSendMessage, allowFiles = false }) => {
  const [newMessage, setNewMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const fileInputRef = useRef(null)

  const clearSelectedFile = () => {
    setSelectedFile(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = null
    }
  }

  const handleSendMessage = (event) => {
    event.preventDefault()

    const text = newMessage.trim()
    if (!text && !selectedFile) return

    onSendMessage({ text, file: selectedFile })
    setNewMessage('')
    clearSelectedFile()
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      Swal.fire('Archivo grande', 'El límite es 10MB.', 'warning')
      clearSelectedFile()
      return
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      Swal.fire(
        'Formato no permitido',
        'Solo se permiten imágenes JPG, PNG, GIF y archivos PDF.',
        'warning',
      )
      clearSelectedFile()
      return
    }

    setSelectedFile(file)
  }

  return (
    <footer className="composer">
      <div className="composer-inner">
        {selectedFile && (
          <div className="file-preview-strip">
            <FontAwesomeIcon icon={faPaperclip} />
            <span className="min-w-0 flex-1 truncate">{selectedFile.name}</span>
            <button
              type="button"
              onClick={clearSelectedFile}
              className="icon-button !h-8 !w-8 !rounded-full"
              aria-label="Quitar archivo"
              title="Quitar archivo"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        )}

        <form
          onSubmit={handleSendMessage}
          className={`composer-form ${
            allowFiles
              ? 'composer-form--with-files'
              : 'composer-form--text-only'
          }`}
        >
          {allowFiles && (
            <div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept={ALLOWED_FILE_TYPES.join(',')}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="icon-button"
                aria-label="Adjuntar archivo"
                title="Adjuntar archivo"
              >
                <FontAwesomeIcon icon={faPaperclip} />
              </button>
            </div>
          )}

          <Input
            type="text"
            placeholder="Escribe un mensaje..."
            value={newMessage}
            onChange={(event) => setNewMessage(event.target.value)}
            aria-label="Mensaje"
          />

          <button
            type="submit"
            className="icon-button send-button"
            aria-label="Enviar mensaje"
            title="Enviar mensaje"
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        </form>
      </div>
    </footer>
  )
}

export default MessageForm
