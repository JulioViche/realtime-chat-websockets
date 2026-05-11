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

const getPinSecurityMeta = (room) => {
  if (room.pinSecurityMode === 'NON_RECOVERABLE' || room.pinCanBeRecovered === false) {
    return {
      label: 'Máxima seguridad',
      badgeClass: 'badge-secure',
      pinText: 'No recuperable',
    }
  }

  if (room.pin) {
    return {
      label: 'Visible en panel',
      badgeClass: 'badge-recoverable',
      pinText: room.pin,
    }
  }

  return {
    label: 'Recuperación no disponible',
    badgeClass: 'badge-muted',
    pinText: 'No disponible',
  }
}

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [selectedRoomIds, setSelectedRoomIds] = useState([])
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
  const selectedRoomIdSet = useMemo(
    () => new Set(selectedRoomIds),
    [selectedRoomIds],
  )
  const selectedCount = selectedRoomIds.length
  const allRoomsSelected = rooms.length > 0 && selectedCount === rooms.length

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

  useEffect(() => {
    setSelectedRoomIds((currentIds) => {
      const availableRoomIds = new Set(rooms.map((room) => room._id))
      const nextIds = currentIds.filter((id) => availableRoomIds.has(id))
      return nextIds.length === currentIds.length ? currentIds : nextIds
    })
  }, [rooms])

  const toggleRoomSelection = (roomId) => {
    setSelectedRoomIds((currentIds) =>
      currentIds.includes(roomId)
        ? currentIds.filter((id) => id !== roomId)
        : [...currentIds, roomId],
    )
  }

  const toggleAllRoomsSelection = () => {
    setSelectedRoomIds(allRoomsSelected ? [] : rooms.map((room) => room._id))
  }

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

  const handleDeleteRooms = async ({ all = false } = {}) => {
    const roomIds = all ? rooms.map((room) => room._id) : selectedRoomIds
    const roomCount = roomIds.length
    const roomLabel = roomCount === 1 ? 'sala' : 'salas'

    if (roomCount === 0) return

    const result = await Swal.fire({
      title: all ? '¿Cerrar todas las salas?' : `¿Cerrar ${roomCount} ${roomLabel}?`,
      text: all
        ? 'Se eliminarán todas las salas y sus mensajes.'
        : 'Se eliminarán las salas seleccionadas y sus mensajes.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#61727a',
      confirmButtonText: all ? 'Sí, cerrar todas' : 'Sí, cerrar seleccionadas',
      cancelButtonText: 'Cancelar',
    })

    if (!result.isConfirmed) return

    try {
      const response = await fetch('/api/rooms/bulk', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(all ? { all: true } : { ids: roomIds }),
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Error al eliminar')

      await Swal.fire(
        'Salas cerradas',
        `Se eliminaron ${data.deletedCount || roomCount} ${roomLabel}.`,
        'success',
      )
      setSelectedRoomIds([])
      fetchRooms()
    } catch (error) {
      Swal.fire('Error', error.message || 'No se pudieron eliminar las salas.', 'error')
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
        '<div><label>Tratamiento del PIN</label>' +
        '<div class="swal-security-options">' +
        '<label class="security-option">' +
        '<input type="radio" name="pinSecurityMode" value="RECOVERABLE" checked>' +
        '<span><strong>Visible en panel</strong><small>Valida con bcrypt y guarda una copia cifrada AES-GCM para que el admin pueda ver el PIN.</small></span>' +
        '</label>' +
        '<label class="security-option">' +
        '<input type="radio" name="pinSecurityMode" value="NON_RECOVERABLE">' +
        '<span><strong>Máxima seguridad</strong><small>Solo guarda bcrypt y huella HMAC. El PIN no se podrá recuperar ni mostrar después.</small></span>' +
        '</label>' +
        '</div></div>' +
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
        const pinSecurityMode = document.querySelector(
          'input[name="pinSecurityMode"]:checked',
        ).value

        if (!name) {
          Swal.showValidationMessage('El nombre es obligatorio')
          return false
        }

        if (!pin || !/^\d{4,}$/.test(pin)) {
          Swal.showValidationMessage('El PIN debe tener al menos 4 dígitos numéricos')
          return false
        }

        return { name, pin, type, pinSecurityMode }
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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch {
      // El cierre local sigue siendo válido si el servidor no responde.
    }

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

          <div className="dashboard-actions">
            {rooms.length > 0 && (
              <>
                <button
                  type="button"
                  className="selection-toggle"
                  onClick={toggleAllRoomsSelection}
                >
                  <input
                    type="checkbox"
                    checked={allRoomsSelected}
                    readOnly
                    tabIndex={-1}
                  />
                  <span>{allRoomsSelected ? 'Quitar selección' : 'Seleccionar todas'}</span>
                </button>

                <Button
                  text={`Cerrar (${selectedCount})`}
                  icon={faTrash}
                  variant="danger"
                  customClass="!mt-0"
                  disabled={selectedCount === 0}
                  onClick={() => handleDeleteRooms()}
                />

                <Button
                  text="Cerrar todas"
                  icon={faTrash}
                  variant="danger"
                  customClass="!mt-0"
                  onClick={() => handleDeleteRooms({ all: true })}
                />
              </>
            )}

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
              const pinMeta = getPinSecurityMeta(room)
              const isSelected = selectedRoomIdSet.has(room._id)

              return (
                <article
                  className={`room-card ${isSelected ? 'room-card-selected' : ''}`}
                  key={room._id}
                >
                  <div>
                    <div className="room-card-controls">
                      <label className="room-select">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRoomSelection(room._id)}
                          aria-label={`Seleccionar ${room.name}`}
                        />
                        <span>Seleccionar</span>
                      </label>

                      <span className={`badge ${typeMeta.badgeClass}`}>
                        {typeMeta.label}
                      </span>
                    </div>

                    <div className="mt-4 flex items-start justify-between gap-3">
                      <h3 className="text-xl font-black text-[var(--color-heading)]">
                        {room.name}
                      </h3>
                    </div>

                    <div className="mt-5 space-y-3 text-sm text-[var(--color-muted)]">
                      <p>
                        PIN:{' '}
                        <span className="pin-code rounded-lg bg-[var(--color-surface-muted)] px-2 py-1">
                          {pinMeta.pinText}
                        </span>
                      </p>
                      <p>
                        Seguridad:{' '}
                        <span className={`badge ${pinMeta.badgeClass}`}>
                          {pinMeta.label}
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
