import { useState } from 'react'
import FormField from '../molecules/FormField'
import Button from '../atoms/Button'
import Link from '../atoms/Link'
import Error from '../atoms/Error'
import FormTemplate from '../templates/FormTemplate'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const handleLogin = async () => {
    setError(null)
    if (!username || !password) {
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

      // Autenticación exitosa: guardamos token y redirigimos
      localStorage.setItem('adminToken', data.token)
      window.location.href = '/admin/dashboard'
    } catch (err) {
      setError('Error al conectar con el servidor')
    }
  }

  return (
    <FormTemplate
      title="Bienvenido Administrador"
      subtitle="Ingresa tus credenciales para iniciar sesión"
    >
      {error && <Error message={error} />}

      <FormField
        label="Usuario"
        type="text"
        placeholder="Ingresa tu usuario"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <FormField
        label="Contraseña"
        type="password"
        placeholder="Ingresa tu contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button text="Iniciar Sesión" onClick={handleLogin} />
      <Link message="¿Eres un usuario?" text="Únete a una sala" href="/" />
    </FormTemplate>
  )
}

export default Login
