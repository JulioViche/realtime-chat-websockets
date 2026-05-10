import { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import Button from '../atoms/Button'

const AdminDashboard = () => {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('adminToken')

  // Protección de ruta síncrona para evitar "parpadeos"
  useEffect(() => {
    if (!token) {
      window.location.href = '/admin'
    } else {
      fetchRooms()
    }
  }, [token])

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Error al obtener salas')
      const data = await response.json()
      setRooms(data)
    } catch (err) {
      console.error('Error al cargar salas', err)
      Swal.fire('Error', 'No se pudieron cargar las salas.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRoom = async (roomId, roomName) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Vas a cerrar la sala "${roomName}". Se perderán los mensajes.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, cerrar sala',
      cancelButtonText: 'Cancelar'
    })

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/rooms/${roomId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!response.ok) throw new Error('Error al eliminar')
        
        Swal.fire('¡Cerrada!', 'La sala ha sido eliminada.', 'success')
        fetchRooms() // Recargar lista
      } catch (err) {
        Swal.fire('Error', 'No se pudo eliminar la sala.', 'error')
      }
    }
  }

  const handleCreateRoom = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Crear Nueva Sala',
      html:
        '<div class="flex flex-col gap-4 text-left">' +
        '<div><label class="block text-sm font-medium text-gray-700 mb-1">Nombre de la sala</label>' +
        '<input id="swal-input1" class="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="Ej: Sala de Soporte"></div>' +
        '<div><label class="block text-sm font-medium text-gray-700 mb-1">Tipo de sala</label>' +
        '<select id="swal-input2" class="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500">' +
        '<option value="TEXT">Solo Texto</option>' +
        '<option value="MULTIMEDIA">Multimedia (Archivos)</option>' +
        '</select></div>' +
        '</div>',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Crear Sala',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3b82f6',
      preConfirm: () => {
        const name = document.getElementById('swal-input1').value
        const type = document.getElementById('swal-input2').value
        if (!name) {
          Swal.showValidationMessage('El nombre es obligatorio')
          return false
        }
        return { name, type }
      }
    })

    if (formValues) {
      try {
        const response = await fetch('/api/rooms/', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify(formValues)
        })
        const data = await response.json()
        
        if (!response.ok) throw new Error(data.error || 'Error al crear')

        await Swal.fire({
          icon: 'success',
          title: '¡Sala creada!',
          html: `La sala se ha creado con éxito.<br><br><b>PIN de acceso:</b> <span class="text-2xl text-blue-600 font-mono">${data.room.pin}</span>`,
          confirmButtonColor: '#3b82f6'
        })
        
        fetchRooms() // Recargar lista
      } catch (err) {
        Swal.fire('Error', err.message || 'No se pudo crear la sala.', 'error')
      }
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    window.location.href = '/admin'
  }

  if (!token) return null

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
             <Button text="+ Nueva Sala" onClick={handleCreateRoom} customClass="!mt-0" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
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
                    <span className="font-medium">Estado:</span> Activa
                  </p>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button 
                    onClick={() => handleDeleteRoom(room._id, room.name)}
                    className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
                  >
                    Cerrar Sala
                  </button>
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
        )}
      </main>
    </div>
  )
}

export default AdminDashboard
