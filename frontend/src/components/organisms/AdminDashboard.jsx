import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import {
  faComments,
  faDoorOpen,
  faLayerGroup,
  faPlus,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Button from '../atoms/Button'
import ThemeToggle from '../atoms/ThemeToggle'

const getRoomTypeMeta = (type) => {
  if (type === 'MULTIMEDIA') {
    return {
      label: 'Multimedia',
      badgeClass: 'badge-accent',
    }
  }

  return {
    label: 'Solo texto',
    badgeClass: 'badge-primary',
  }
}

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('adminToken')

  const roomStats = useMemo(
    () => ({
      total: rooms.length,
      text: rooms.filter((room) => room.type === 'TEXT').length,
      multimedia: rooms.filter((room) => room.type === 'MULTIMEDIA').length,
    }),
    [rooms],
  )

  const fetchRooms = useCallback(async () => {
    try {
      const response = await fetch('/api/rooms/', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error('Error al obtener salas')

      const data = await response.json()
      setRooms(data)
    } catch {
      Swal.fire('Error', 'No se pudieron cargar las salas.', 'error')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (!token) {
      navigate('/admin')
      return
    }

    fetchRooms()
  }, [fetchRooms, navigate, token])

  const handleDeleteRoom = async (roomId, roomName) => {
    const result = await Swal.fire({
      title: '¿Cerrar sala?',
      text: `Vas a cerrar "${roomName}" y se eliminarán sus mensajes.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#61727a',
      confirmButtonText: 'Sí, cerrar',
      cancelButtonText: 'Cancelar',
    })

    if (!result.isConfirmed) return

    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error('Error al eliminar')

      await Swal.fire('Sala cerrada', 'La sala fue eliminada.', 'success')
      fetchRooms()
    } catch {
      Swal.fire('Error', 'No se pudo eliminar la sala.', 'error')
    }
  }

  const handleCreateRoom = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Crear nueva sala',
      html:
        '<div class="swal-form">' +
        '<div><label for="swal-input1">Nombre de la sala</label>' +
        '<input id="swal-input1" placeholder="Ej: Sala de soporte"></div>' +
        '<div><label for="swal-input2">PIN de acceso (mín. 4 dígitos)</label>' +
        '<input id="swal-input2" type="text" maxlength="10" placeholder="Ej: 1234"></div>' +
        '<div><label for="swal-input3">Tipo de sala</label>' +
        '<select id="swal-input3">' +
        '<option value="TEXT">Solo texto</option>' +
        '<option value="MULTIMEDIA">Multimedia</option>' +
        '</select></div>' +
        '</div>',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Crear sala',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0f766e',
      cancelButtonColor: '#61727a',
      preConfirm: () => {
        const name = document.getElementById('swal-input1').value.trim()
        const pin = document.getElementById('swal-input2').value.trim()
        const type = document.getElementById('swal-input3').value

        if (!name) {
          Swal.showValidationMessage('El nombre es obligatorio')
          return false
        }

        if (!pin || !/^\d{4,}$/.test(pin)) {
          Swal.showValidationMessage('El PIN debe tener al menos 4 dígitos numéricos')
          return false
        }

        return { name, pin, type }
      },
    })

    if (!formValues) return

    try {
      const response = await fetch('/api/rooms/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formValues),
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Error al crear')

      await Swal.fire({
        icon: 'success',
        title: 'Sala creada',
        text: 'La sala ha sido creada exitosamente.',
        confirmButtonColor: '#0f766e',
      })

      fetchRooms()
    } catch (error) {
      Swal.fire('Error', error.message || 'No se pudo crear la sala.', 'error')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    navigate('/admin')
  }

  if (!token) return null

  return (
    <div className="dashboard-shell page-grid">
      <header className="app-header">
        <div className="header-inner">
          <div className="brand-lockup">
            <span className="brand-mark">
              <FontAwesomeIcon icon={faLayerGroup} />
            </span>
            <div>
              <h1 className="header-title">Panel de control</h1>
              <p className="header-subtitle">Gestión de salas en tiempo real</p>
            </div>
          </div>

          <div className="nav-actions">
            <ThemeToggle />
            <Button
              text="Cerrar sesión"
              icon={faDoorOpen}
              variant="ghost"
              customClass="!mt-0"
              onClick={handleLogout}
            />
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="dashboard-stats" aria-label="Resumen de salas">
          <div className="stat-card">
            <span>Salas activas</span>
            <strong>{roomStats.total}</strong>
          </div>
          <div className="stat-card">
            <span>Solo texto</span>
            <strong>{roomStats.text}</strong>
          </div>
          <div className="stat-card">
            <span>Multimedia</span>
            <strong>{roomStats.multimedia}</strong>
          </div>
        </section>

        <div className="dashboard-toolbar">
          <div>
            <p className="panel-kicker">Administración</p>
            <h2 className="text-2xl font-black text-[var(--color-heading)]">
              Salas disponibles
            </h2>
          </div>

          <div className="w-full sm:w-48">
            <Button
              text="Nueva sala"
              icon={faPlus}
              customClass="!mt-0"
              onClick={handleCreateRoom}
            />
          </div>
        </div>

        {loading ? (
          <div className="grid min-h-64 place-items-center">
            <div>
              <div className="spinner mx-auto" />
              <p className="mt-4 text-center text-[var(--color-muted)]">
                Cargando salas...
              </p>
            </div>
          </div>
        ) : rooms.length === 0 ? (
          <div className="empty-state">
            <div>
              <FontAwesomeIcon
                icon={faComments}
                className="mb-4 text-3xl text-[var(--color-primary)]"
              />
              <p className="font-bold">No hay salas activas.</p>
              <p className="mt-1 text-sm">Crea una sala para comenzar.</p>
            </div>
          </div>
        ) : (
          <div className="room-grid">
            {rooms.map((room) => {
              const typeMeta = getRoomTypeMeta(room.type)

              return (
                <article className="room-card" key={room._id}>
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-xl font-black text-[var(--color-heading)]">
                        {room.name}
                      </h3>
                      <span className={`badge ${typeMeta.badgeClass}`}>
                        {typeMeta.label}
                      </span>
                    </div>

                    <div className="mt-5 space-y-3 text-sm text-[var(--color-muted)]">
                      <p>
                        PIN:{' '}
                        <span className="pin-code rounded-lg bg-[var(--color-surface-muted)] px-2 py-1">
                          Privado
                        </span>
                      </p>
                      <p>
                        Estado:{' '}
                        <span className="font-black text-[var(--color-success)]">
                          Activa
                        </span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteRoom(room._id, room.name)}
                    className="danger-outline-button"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    Cerrar sala
                  </button>
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

export default AdminDashboard
