import { BrowserRouter, Routes, Route } from 'react-router-dom'
import JoinRoom from './components/organisms/JoinRoom'
import Login from './components/organisms/Login'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta principal: vista de los usuarios para unirse */}
        <Route path="/" element={<JoinRoom />} />

        {/* Ruta de administración */}
        <Route path="/admin" element={<Login />} />

        {/* Placeholder para la futura interfaz del chat */}
        {/* <Route path="/chat" element={<div>Vista del Chat (en construcción)</div>} /> */}
      </Routes>
    </BrowserRouter>
  )
}

export default App
