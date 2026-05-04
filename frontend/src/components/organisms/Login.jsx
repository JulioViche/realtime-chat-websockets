import FormField from '../molecules/FormField'
import Button from '../atoms/Button'

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Bienvenido Administrador
        </h2>
        <FormField
          label="Usuario"
          type="text"
          placeholder="Ingresa tu usuario"
        />
        <FormField
          label="Contraseña"
          type="password"
          placeholder="Ingresa tu contraseña"
        />
        <Button
          text="Iniciar Sesión"
          onClick={() => console.log('Login Admin')}
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
