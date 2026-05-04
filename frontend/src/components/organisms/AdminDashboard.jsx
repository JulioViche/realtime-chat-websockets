import { useState, useEffect } from 'react'
import Button from '../atoms/Button'

const AdminDashboard = () => {
  // Protección de ruta síncrona para evitar "parpadeos"
  const token = localStorage.getItem('adminToken')
  if (!token) {
    window.location.href = '/admin'
    return null // No renderiza nada mientras redirige
  }

  // Datos simulados (mocks) de las salas activas
  const [rooms, setRooms] = useState([
    { _id: '1', name: 'Sala General', pin: '123456', type: 'MULTIMEDIA', users: 5 },
    { _id: '2', name: 'Soporte Técnico', pin: '888999', type: 'TEXT', users: 2 },
  ])

  const handleCreateRoom = () => {
    // Aquí luego abriremos un modal o form para crear la sala
    alert('Función de crear sala (Próximamente)')
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    window.location.href = '/admin'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header del Dashboard */}
      <header className="bg-white shadow-sm px-8 py-5 flex justify-between items-center border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Panel de Control</h1>
          <p className="text-sm text-gray-500">Gestión de salas de chat</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-gray-500 hover:text-gray-800 font-medium text-sm transition-colors"
        >
          Cerrar Sesión
        </button>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 p-8 max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-700">Salas Activas ({rooms.length})</h2>
          <div className="w-40">
             {/* Usamos !mt-0 para quitar el margen superior por defecto si es que lo tuviera */}
             <Button text="+ Nueva Sala" onClick={handleCreateRoom} customClass="!mt-0" />
          </div>
        </div>

        {/* Grid de Salas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div key={room._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-gray-800">{room.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${room.type === 'MULTIMEDIA' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                  {room.type}
                </span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <span className="font-medium">PIN:</span>{' '}
                  <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">{room.pin}</span>
                </p>
                <p>
                  <span className="font-medium">Usuarios conectados:</span> {room.users}
                </p>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">Cerrar Sala</button>
                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">Historial</button>
              </div>
            </div>
          ))}
          
          {rooms.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
              No hay salas activas. Crea una nueva sala para empezar.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard
