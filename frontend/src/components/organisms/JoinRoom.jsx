import { useState } from 'react'
import FormField from '../molecules/FormField'
import Button from '../atoms/Button'
import Link from '../atoms/Link'
import Error from '../atoms/Error'
import FormTemplate from '../templates/FormTemplate'

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
    <FormTemplate
      title="Unirse a Sala"
      subtitle="Ingresa tu nickname y el PIN de la sala"
    >
      {error && <Error message={error} />}
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
      <Link
        message="¿Eres administrador?"
        text="Inicia sesión aquí"
        href="/admin"
      />
    </FormTemplate>
  )
}

export default JoinRoom
