import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { faLockOpen } from '@fortawesome/free-solid-svg-icons'
import FormField from '../molecules/FormField'
import Button from '../atoms/Button'
import Link from '../atoms/Link'
import Error from '../atoms/Error'
import FormTemplate from '../templates/FormTemplate'

const Login = () => {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const handleLogin = async (event) => {
    event.preventDefault()
    setError(null)

    if (!username.trim() || !password.trim()) {
      setError('Por favor llena todos los campos')
      return
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Credenciales inválidas')
        return
      }

      localStorage.setItem('adminToken', data.token)
      navigate('/admin/dashboard')
    } catch {
      setError('Error al conectar con el servidor')
    }
  }

  return (
    <FormTemplate
      title="Panel administrador"
      subtitle="Administra salas, tipos de acceso y sesiones activas desde un solo lugar."
      kicker="Control de salas"
      variant="admin"
    >
      <form onSubmit={handleLogin}>
        {error && <Error message={error} />}

        <FormField
          label="Usuario"
          type="text"
          name="username"
          placeholder="Ingresa tu usuario"
          value={username}
          autoComplete="username"
          onChange={(e) => setUsername(e.target.value)}
        />
        <FormField
          label="Contraseña"
          type="password"
          name="password"
          placeholder="Ingresa tu contraseña"
          value={password}
          autoComplete="current-password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" text="Iniciar sesión" icon={faLockOpen} />
      </form>

      <Link message="¿Eres un usuario?" text="Únete a una sala" href="/" />
    </FormTemplate>
  )
}

export default Login
