import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { faArrowRight } from '@fortawesome/free-solid-svg-icons'
import FormField from '../molecules/FormField'
import Button from '../atoms/Button'
import Link from '../atoms/Link'
import Error from '../atoms/Error'
import FormTemplate from '../templates/FormTemplate'

const JoinRoom = () => {
  const navigate = useNavigate()
  const [nickname, setNickname] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState(null)

  const handleJoin = (event) => {
    event.preventDefault()
    setError(null)

    const cleanNickname = nickname.trim()
    const cleanPin = pin.trim().toUpperCase()

    if (!cleanNickname || !cleanPin) {
      setError('Por favor, completa ambos campos.')
      return
    }

    localStorage.setItem('userNickname', cleanNickname)
    navigate(`/room/${cleanPin}`)
  }

  return (
    <FormTemplate
      title="Únete a tu sala"
      subtitle="Entra con tu nickname y el PIN privado para comenzar la conversación."
      kicker="Chat de invitados"
    >
      <form onSubmit={handleJoin}>
        {error && <Error message={error} />}
        <FormField
          label="Nickname"
          type="text"
          name="nickname"
          placeholder="Ej: NinjaGamer"
          value={nickname}
          autoComplete="nickname"
          onChange={(e) => setNickname(e.target.value)}
        />
        <FormField
          label="PIN de la sala"
          type="text"
          name="pin"
          placeholder="Ej: 123456"
          value={pin}
          autoCapitalize="characters"
          onChange={(e) => setPin(e.target.value)}
        />
        <Button type="submit" text="Entrar al chat" icon={faArrowRight} />
      </form>

      <Link
        message="¿Gestionas las salas?"
        text="Entrar al panel"
        href="/admin"
      />
    </FormTemplate>
  )
}

export default JoinRoom
