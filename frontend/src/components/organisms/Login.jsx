import LoginField from '../molecules/LoginField'
import LoginButton from '../atoms/LoginButton'

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Bienvenido
        </h2>
        <LoginField
          label="Usuario"
          type="text"
          placeholder="Ingresa tu usuario"
        />
        <LoginField
          label="Contraseña"
          type="password"
          placeholder="Ingresa tu contraseña"
        />
        <LoginButton text="Iniciar Sesión" />
        {/* <div className="mt-6 text-center text-sm text-gray-600">
          Don't have an account? <a href="#" className="text-blue-600 hover:underline font-medium">Sign up</a>
        </div> */}
      </div>
    </div>
  )
}

export default Login
