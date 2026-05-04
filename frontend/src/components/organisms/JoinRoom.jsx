import { useState } from 'react'
import FormField from '../molecules/FormField'
import Button from '../atoms/Button'

const JoinRoom = () => {
  const [nickname, setNickname] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState(null)

  const handleJoin = async () => {
    setError(null)

    // Validaciones básicas
    if (!nickname || !pin) {
      setError('Por favor, completa ambos campos.')
      return
    }

    // Guardar el nombre temporalmente
    localStorage.setItem('userNickname', nickname)

    // Redirigir directamente a la sala, la validación se hará por Socket allá
    window.location.href = `/room/${pin.toUpperCase()}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Unirse a Sala
        </h2>
        <p className="text-center text-gray-500 mb-8">
          Ingresa tu nickname y el PIN de la sala
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center">
            {error}
          </div>
        )}

        <FormField
          label="Nickname"
          type="text"
          placeholder="Ej: NinjaGamer"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />

        <FormField
          label="PIN de la Sala"
          type="text"
          placeholder="Ej: 123456"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />

        <Button text="Entrar al Chat" onClick={handleJoin} />

        <div className="mt-6 text-center text-sm text-gray-600">
          ¿Eres administrador?{' '}
          <a
            href="/admin"
            className="text-blue-600 hover:underline font-medium"
          >
            Inicia sesión aquí
          </a>
        </div>
      </div>
    </div>
  )
}

export default JoinRoom
