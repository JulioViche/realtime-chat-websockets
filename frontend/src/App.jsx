import { BrowserRouter, Routes, Route } from 'react-router-dom'
import JoinRoom from './components/organisms/JoinRoom'
import Login from './components/organisms/Login'
import AdminDashboard from './components/organisms/AdminDashboard'
import Room from './components/organisms/Room'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta principal: vista de los usuarios para unirse */}
        <Route path="/" element={<JoinRoom />} />

        {/* Rutas de administración */}
        <Route path="/admin" element={<Login />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* Vista principal de la sala de chat */}
        <Route path="/room" element={<Room />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
