import { BrowserRouter, Routes, Route } from 'react-router-dom'
import JoinRoom from './components/organisms/JoinRoom'
import Login from './components/organisms/Login'
import Room from './components/organisms/Room'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta principal: vista de los usuarios para unirse */}
        <Route path="/" element={<JoinRoom />} />

        {/* Ruta de administración */}
        <Route path="/admin" element={<Login />} />

        {/* Vista principal de la sala de chat */}
        <Route path="/room" element={<Room />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
