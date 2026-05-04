import { useState } from 'react'
import FormField from '../molecules/FormField'
import Button from '../atoms/Button'

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
        body: JSON.stringify({ username, password })
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Bienvenido Administrador
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center">
            {error}
          </div>
        )}

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
        <Button
          text="Iniciar Sesión"
          onClick={handleLogin}
        />
        <div className="mt-6 text-center text-sm text-gray-600">
          ¿Eres un usuario?{' '}
          <a href="/" className="text-blue-600 hover:underline font-medium">
            Únete a una sala
          </a>
        </div>
      </div>
    </div>
  )
}

export default Login
