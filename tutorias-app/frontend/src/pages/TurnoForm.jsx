// src/pages/TurnoForm.jsx
// Sirve tanto para crear (POST) como para editar (PUT) un turno.
// Detecta si es creación o edición por la presencia del :id en la URL.

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import turnosService from '../services/turnosService'
import tutoresService from '../services/tutoresService'
import usuariosService from '../services/usuariosService'
import { useAuth } from '../context/AuthContext'

// Helper: genera opciones de hora inicio entre 08:00 y 22:00 (inclusive) cada 1h
function generateStartOptions() {
  const options = []
  for (let h = 8; h <= 22; h++) {
    const hh = String(h).padStart(2, '0')
    options.push(`${hh}:00`)
  }
  return options
}

function timeToMinutes(t) {
  const [hh, mm] = t.split(':').map(Number)
  return hh * 60 + mm
}

function minutesToTime(m) {
  const hh = Math.floor(m / 60)
  const mm = m % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

function addHours(timeStr, hours) {
  if (!timeStr) return ''
  const mins = timeToMinutes(timeStr)
  return minutesToTime(mins + hours * 60)
}

// max end is start + 3h but not later than 23:00
function computeMaxEnd(start) {
  if (!start) return '23:00'
  const candidate = addHours(start, 3)
  return timeToMinutes(candidate) > timeToMinutes('23:00') ? '23:00' : candidate
}

function computeEndOptions(start) {
  if (!start) return []
  const options = []
  const startMin = timeToMinutes(start)
  const maxEndMin = timeToMinutes(computeMaxEnd(start))
  // end must be at least start + 1h
  for (let end = startMin + 60; end <= Math.min(startMin + 3 * 60, maxEndMin); end += 60) {
    options.push(minutesToTime(end))
  }
  return options
}

export default function TurnoForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario } = useAuth()

  const esEdicion = Boolean(id)

  const [form, setForm] = useState({
    tutorId: '',
    estudianteId: '',
    fecha: '',
    horaInicio: '',
    horaFin: '',
    tema: '',
    modalidad: 'virtual',
    observaciones: ''
  })
  const [tutores, setTutores] = useState([])
  const [estudiantes, setEstudiantes] = useState([])
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [cargandoInicial, setCargandoInicial] = useState(esEdicion)

  useEffect(() => {
    cargarTutores()
    if (usuario?.rol !== 'estudiante') {
      cargarEstudiantes()
    }
    if (esEdicion) {
      cargarTurnoParaEditar()
    }
  }, [])

  async function cargarTutores() {
    try {
      const lista = await tutoresService.listar()
      setTutores(lista)
    } catch (err) {
      console.error('Error al cargar tutores:', err)
    }
  }

  async function cargarEstudiantes() {
    try {
      const lista = await usuariosService.listar({ rol: 'estudiante' })
      setEstudiantes(lista.filter(u => u.activo))
    } catch (err) {
      console.error('Error al cargar estudiantes:', err)
    }
  }

  async function cargarTurnoParaEditar() {
    try {
      const turno = await turnosService.obtener(parseInt(id))
      // Precargamos el formulario con los datos actuales del turno
      setForm({
        tutorId: turno.tutorId || '',
        fecha: turno.fecha || '',
        horaInicio: turno.horaInicio || '',
        horaFin: turno.horaFin || '',
        tema: turno.tema || '',
        modalidad: turno.modalidad || 'virtual',
        observaciones: turno.observaciones || ''
      })
    } catch (err) {
      setError('Error al cargar el turno')
    } finally {
      setCargandoInicial(false)
    }
  }

  // handleChange es un handler genérico — actualiza el campo que cambió en el form
  // e.target.name identifica cuál input disparó el evento
  function handleChange(e) {
    const { name, value } = e.target
    // Spread del estado anterior + solo cambia el campo que corresponde
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setCargando(true)

    try {
      const datos = {
        ...form,
        tutorId: parseInt(form.tutorId),
        estudianteId: form.estudianteId ? parseInt(form.estudianteId) : undefined
      }

      let turno
      if (esEdicion) {
        turno = await turnosService.editar(parseInt(id), datos)
      } else {
        turno = await turnosService.crear(datos)
      }

      // Después de guardar, redirigimos al detalle del turno
      navigate(`/turnos/${turno.id}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el turno')
    } finally {
      setCargando(false)
    }
  }

  if (cargandoInicial) return <div style={{ textAlign: 'center', padding: '60px' }}>Cargando...</div>

  return (
    <div style={{ maxWidth: '600px', margin: '24px auto', padding: '0 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>{esEdicion ? '✏️ Editar Turno' : '➕ Nuevo Turno'}</h2>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: '1px solid #ddd', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
          ← Volver
        </button>
      </div>

      {error && (
        <div style={{ background: '#fee', border: '1px solid #fcc', padding: '12px', borderRadius: '4px', marginBottom: '16px', color: '#c00' }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Selector de tutor */}
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Tutor</label>
          <select
            name="tutorId"
            value={form.tutorId}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
          >
            <option value="">-- Seleccioná un tutor --</option>
            {tutores.map(tutor => (
              <option key={tutor.id} value={tutor.id}>
                {tutor.nombre} — {tutor.especialidad} ({tutor.diasDisponibles.join(', ')})
              </option>
            ))}
          </select>
        </div>

        {/* Selector de estudiante — visible solo para tutores y admins */}
        {usuario?.rol !== 'estudiante' && (
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Estudiante</label>
            <select
              name="estudianteId"
              value={form.estudianteId}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
            >
              <option value="">-- Seleccioná un estudiante --</option>
              {estudiantes.map(est => (
                <option key={est.id} value={est.id}>
                  {est.nombre} ({est.email})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Fecha */}
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Fecha</label>
          <input
            type="date"
            name="fecha"
            value={form.fecha}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
          />
        </div>

        {/* Horario */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Hora inicio</label>
            <select
              name="horaInicio"
              value={form.horaInicio}
              onChange={e => {
                const value = e.target.value
                // si el nuevo inicio hace inválido el fin, lo ajustamos
                setForm(prev => {
                  const maxEnd = computeMaxEnd(value)
                  let nuevaHoraFin = prev.horaFin
                  if (!nuevaHoraFin || nuevaHoraFin <= value || nuevaHoraFin > maxEnd) {
                    // por defecto ponemos el primer slot disponible (value + 1h)
                    nuevaHoraFin = addHours(value, 1)
                  }
                  return { ...prev, horaInicio: value, horaFin: nuevaHoraFin }
                })
              }}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
            >
              <option value="">-- Seleccioná hora inicio --</option>
              {generateStartOptions().map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Hora fin</label>
            <select
              name="horaFin"
              value={form.horaFin}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
            >
              <option value="">-- Seleccioná hora fin --</option>
              {computeEndOptions(form.horaInicio).map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tema */}
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Tema</label>
          <input
            type="text"
            name="tema"
            value={form.tema}
            onChange={handleChange}
            required
            placeholder="Ej: Testing con Jest, REST APIs, etc."
            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
          />
        </div>

        {/* Modalidad */}
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Modalidad</label>
          <select
            name="modalidad"
            value={form.modalidad}
            onChange={handleChange}
            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
          >
            <option value="virtual">Virtual</option>
            <option value="presencial">Presencial</option>
          </select>
        </div>

        {/* Observaciones (solo en edición) */}
        {esEdicion && (
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Observaciones</label>
            <textarea
              name="observaciones"
              value={form.observaciones}
              onChange={handleChange}
              rows={3}
              style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={cargando}
          style={{ padding: '14px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
        >
          {cargando ? 'Guardando...' : (esEdicion ? 'Guardar cambios' : 'Solicitar turno')}
        </button>
      </form>
    </div>
  )
}
