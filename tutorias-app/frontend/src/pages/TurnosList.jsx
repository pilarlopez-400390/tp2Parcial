// src/pages/TurnosList.jsx
// Lista turnos con filtros y paginacion.

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import turnosService from '../services/turnosService'
import tutoresService from '../services/tutoresService'

const COLORES_ESTADO = {
  solicitado: { bg: '#fff4df', color: '#8a5b13', border: '#efd49d' },
  confirmado: { bg: '#e8f2f6', color: '#245b73', border: '#b8d4df' },
  realizado: { bg: '#e9f5ef', color: '#2f6f58', border: '#b8ddcd' },
  cancelado: { bg: '#f9eaea', color: '#9f3a3a', border: '#efc7c7' }
}

export default function TurnosList() {
  const { usuario } = useAuth()

  const [turnos, setTurnos] = useState([])
  const [tutores, setTutores] = useState([])
  const [pagination, setPagination] = useState({})
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroFechaModo, setFiltroFechaModo] = useState('todos')
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('')
  const [filtroTutor, setFiltroTutor] = useState('')
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('')
  const [filtroModalidad, setFiltroModalidad] = useState('')
  const [filtroEstudiante, setFiltroEstudiante] = useState('')
  const [estadoAplicado, setEstadoAplicado] = useState('')
  const [fechaModoAplicado, setFechaModoAplicado] = useState('todos')
  const [fechaDesdeAplicada, setFechaDesdeAplicada] = useState('')
  const [tutorAplicado, setTutorAplicado] = useState('')
  const [especialidadAplicada, setEspecialidadAplicada] = useState('')
  const [modalidadAplicada, setModalidadAplicada] = useState('')
  const [estudianteAplicado, setEstudianteAplicado] = useState('')
  const [pagina, setPagina] = useState(1)

  useEffect(() => {
    cargarTutores()
  }, [])

  useEffect(() => {
    cargarTurnos()

  }, [pagina, estadoAplicado, fechaModoAplicado, fechaDesdeAplicada, tutorAplicado, especialidadAplicada, modalidadAplicada, estudianteAplicado])

  async function cargarTutores() {
    try {
      const lista = await tutoresService.listar()
      setTutores(lista)
    } catch (err) {
      console.error('Error al cargar tutores:', err)
    }
  }

  async function cargarTurnos() {
    setCargando(true)
    setError('')
    try {
      const filtros = { page: pagina, limit: 10 }
      if (estadoAplicado) filtros.estado = estadoAplicado
      if (fechaModoAplicado === 'desde' && fechaDesdeAplicada) filtros.fechaDesde = fechaDesdeAplicada
      if (fechaModoAplicado === 'hoy') filtros.fechaHoy = true
      if (fechaModoAplicado === 'anteriores') filtros.fechaAnteriores = true
      if (tutorAplicado) filtros.tutorId = tutorAplicado
      if (especialidadAplicada) filtros.especialidad = especialidadAplicada
      if (modalidadAplicada) filtros.modalidad = modalidadAplicada
      if (estudianteAplicado.trim()) filtros.estudiante = estudianteAplicado.trim()

      const data = await turnosService.listar(filtros)
      setTurnos(data.data)
      setPagination(data.pagination)
    } catch (err) {
      setError('Error al cargar los turnos')
    } finally {
      setCargando(false)
    }
  }

  function handleFiltrar(e) {
    e.preventDefault()
    setPagina(1)
    setEstadoAplicado(filtroEstado)
    setFechaModoAplicado(filtroFechaModo)
    setFechaDesdeAplicada(filtroFechaDesde)
    setTutorAplicado(filtroTutor)
    setEspecialidadAplicada(filtroEspecialidad)
    setModalidadAplicada(filtroModalidad)
    setEstudianteAplicado(filtroEstudiante)
  }

  function handleLimpiar() {
    setFiltroEstado('')
    setFiltroFechaModo('todos')
    setFiltroFechaDesde('')
    setFiltroTutor('')
    setFiltroEspecialidad('')
    setFiltroModalidad('')
    setFiltroEstudiante('')
    setPagina(1)
    setEstadoAplicado('')
    setFechaModoAplicado('todos')
    setFechaDesdeAplicada('')
    setTutorAplicado('')
    setEspecialidadAplicada('')
    setModalidadAplicada('')
    setEstudianteAplicado('')
  }

  function cambiarFiltro(setter, value) {
    setter(value)
    setPagina(1)
    if (setter === setFiltroEstado) setEstadoAplicado(value)
    if (setter === setFiltroFechaModo) {
      setFechaModoAplicado(value)
      if (value !== 'desde') {
        setFiltroFechaDesde('')
        setFechaDesdeAplicada('')
      }
    }
    if (setter === setFiltroFechaDesde) setFechaDesdeAplicada(value)
    if (setter === setFiltroTutor) setTutorAplicado(value)
    if (setter === setFiltroEspecialidad) setEspecialidadAplicada(value)
    if (setter === setFiltroModalidad) setModalidadAplicada(value)
    if (setter === setFiltroEstudiante) setEstudianteAplicado(value)
  }

  const especialidades = [...new Set(tutores.map(t => t.especialidad).filter(Boolean))].sort()

  function temasDelTurno(turno) {
    if (Array.isArray(turno.temas) && turno.temas.length > 0) return turno.temas
    return turno.tema ? [turno.tema] : ['Sin Tema']
  }

  function formatearEtiqueta(valor, fallback = 'Sin dato') {
    if (!valor) return fallback
    const normalizadas = {
      backend: 'Backend',
      frontend: 'Frontend',
      testing: 'Testing',
      seguridad: 'Seguridad',
      solicitado: 'Solicitado',
      confirmado: 'Confirmado',
      realizado: 'Realizado',
      cancelado: 'Cancelado',
      virtual: 'Virtual',
      presencial: 'Presencial'
    }
    const texto = String(valor).trim()
    return normalizadas[texto.toLowerCase()] || texto.charAt(0).toUpperCase() + texto.slice(1)
  }

  return (
    <div style={{ maxWidth: '1080px', margin: '24px auto', padding: '0 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '12px', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, color: '#182230', fontSize: '28px' }}>
          {usuario?.rol === 'admin' ? 'Historial de Turnos' : 'Mis Turnos'}
        </h2>
        {(usuario?.rol === 'estudiante' || usuario?.rol === 'admin') && (
          <Link
            to="/turnos/nuevo"
            style={{ background: '#245b73', color: 'white', padding: '10px 18px', borderRadius: '6px', textDecoration: 'none', fontWeight: '800' }}
          >
            Nuevo Turno
          </Link>
        )}
      </div>

      <div style={{ background: '#fff', padding: '18px', border: '1px solid #d9e2ec', borderRadius: '8px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap', boxShadow: '0 12px 28px rgba(16, 24, 40, 0.06)' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '600' }}>Estado</label>
          <select value={filtroEstado} onChange={e => cambiarFiltro(setFiltroEstado, e.target.value)} style={{ padding: '9px', border: '1px solid #cfd8e3', borderRadius: '4px' }}>
            <option value="">Todos</option>
            <option value="solicitado">Solicitado</option>
            <option value="confirmado">Confirmado</option>
            <option value="realizado">Realizado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '600' }}>Fecha</label>
          <select value={filtroFechaModo} onChange={e => cambiarFiltro(setFiltroFechaModo, e.target.value)} style={{ padding: '9px', border: '1px solid #cfd8e3', borderRadius: '4px', minWidth: '150px' }}>
            <option value="todos">Todas</option>
            <option value="desde">A Partir De</option>
            <option value="hoy">Hoy</option>
            <option value="anteriores">Anteriores A Hoy</option>
          </select>
        </div>

        {filtroFechaModo === 'desde' && (
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '600' }}>Desde</label>
            <input
              type="date"
              value={filtroFechaDesde}
              onChange={e => cambiarFiltro(setFiltroFechaDesde, e.target.value)}
              style={{ padding: '9px', border: '1px solid #cfd8e3', borderRadius: '4px' }}
            />
          </div>
        )}

        {usuario?.rol !== 'estudiante' && (
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '600' }}>Estudiante</label>
            <input
              type="search"
              value={filtroEstudiante}
              onChange={e => cambiarFiltro(setFiltroEstudiante, e.target.value)}
              placeholder="Buscar Por Apellido"
              style={{ padding: '9px', border: '1px solid #cfd8e3', borderRadius: '4px', minWidth: '190px' }}
            />
          </div>
        )}
        {usuario?.rol !== 'tutor' && (
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '600' }}>Tutor</label>
            <select value={filtroTutor} onChange={e => cambiarFiltro(setFiltroTutor, e.target.value)} style={{ padding: '9px', border: '1px solid #cfd8e3', borderRadius: '4px', minWidth: '175px' }}>
              <option value="">Todos</option>
              {tutores.map(tutor => (
                <option key={tutor.id} value={tutor.id}>{tutor.nombre}</option>
              ))}
            </select>
          </div>
        )}


        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '600' }}>Especialidad</label>
          <select value={filtroEspecialidad} onChange={e => cambiarFiltro(setFiltroEspecialidad, e.target.value)} style={{ padding: '9px', border: '1px solid #cfd8e3', borderRadius: '4px', minWidth: '155px' }}>
            <option value="">Todas</option>
            {especialidades.map(especialidad => (
              <option key={especialidad} value={especialidad}>{formatearEtiqueta(especialidad)}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '600' }}>Modalidad</label>
          <select value={filtroModalidad} onChange={e => cambiarFiltro(setFiltroModalidad, e.target.value)} style={{ padding: '9px', border: '1px solid #cfd8e3', borderRadius: '4px', minWidth: '145px' }}>
            <option value="">Todas</option>
            <option value="virtual">Virtual</option>
            <option value="presencial">Presencial</option>
          </select>
        </div>

        <button type="button" onClick={handleLimpiar} style={{ padding: '9px 16px', background: '#667085', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '800' }}>
          Limpiar
        </button>
      </div>

      {error && <div style={{ color: '#9f3a3a', padding: '12px 14px', background: '#f9eaea', border: '1px solid #efc7c7', borderRadius: '6px', marginBottom: '16px', fontWeight: '600' }}>{error}</div>}
      {cargando && <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Cargando...</div>}

      {!cargando && !error && (
        <>
          {turnos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666', background: '#fff', border: '1px solid #d9e0e7', borderRadius: '8px' }}>
              No Hay Turnos Que Mostrar.
            </div>
          ) : (
            <div>
              {turnos.map(turno => {
                const estilo = COLORES_ESTADO[turno.estado] || {}
                const temasTurno = temasDelTurno(turno)
                const categoriaTurno = formatearEtiqueta(turno.categoria || turno.tutorEspecialidad, 'Sin Categoría')
                return (
                  <div
                    key={turno.id}
                    style={{
                      border: `1px solid ${estilo.border || '#ddd'}`,
                      borderLeft: `5px solid ${estilo.border || '#ddd'}`,
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '12px',
                      background: '#fff',
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: '14px',
                      alignItems: 'center',
                      boxShadow: '0 10px 24px rgba(16, 24, 40, 0.06)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '800', marginBottom: '4px', color: '#111827' }}>
                        {turno.fecha} · {turno.horaInicio} - {turno.horaFin}
                      </div>
                      <div style={{ fontSize: '14px', color: '#475467', marginBottom: '4px' }}>
                        Tutor: {turno.tutorNombre || `Tutor ${turno.tutorId}`} · Categoría: {categoriaTurno}
                      </div>
                      <div style={{ fontSize: '14px', color: '#475467', marginBottom: '4px' }}>
                        Temas: {temasTurno.join(', ')}
                      </div>
                      <div style={{ fontSize: '13px', color: '#667085' }}>
                        Estudiante: {turno.estudianteNombre || `#${turno.estudianteId}`} · Modalidad: {formatearEtiqueta(turno.modalidad, 'Sin Modalidad')}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <span style={{
                        background: estilo.bg,
                        color: estilo.color,
                        border: `1px solid ${estilo.border}`,
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '13px',
                        fontWeight: '800'
                      }}>
                        {formatearEtiqueta(turno.estado, 'Sin Estado')}
                      </span>
                      <Link
                        to={`/turnos/${turno.id}`}
                        style={{ color: '#245b73', textDecoration: 'none', fontSize: '14px', fontWeight: '800' }}
                      >
                        Ver detalle
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={pagina === 1}
                style={{ padding: '8px 16px', cursor: 'pointer', border: '1px solid #d9e2ec', borderRadius: '6px', background: pagina === 1 ? '#eef2f6' : 'white' }}
              >
                Anterior
              </button>
              <span style={{ padding: '8px 16px', color: '#666' }}>
                Página {pagina} de {pagination.totalPages} · {pagination.total} Turnos En Total
              </span>
              <button
                onClick={() => setPagina(p => Math.min(pagination.totalPages, p + 1))}
                disabled={pagina === pagination.totalPages}
                style={{ padding: '8px 16px', cursor: 'pointer', border: '1px solid #d9e2ec', borderRadius: '6px', background: pagina === pagination.totalPages ? '#eef2f6' : 'white' }}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
