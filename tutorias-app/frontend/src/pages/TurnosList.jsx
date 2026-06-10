// src/pages/TurnosList.jsx
// Lista todos los turnos con filtros. Es la página principal del sistema.

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import turnosService from '../services/turnosService'

// Colores por estado — hace más fácil leer la lista de un vistazo
const COLORES_ESTADO = {
  solicitado:  { bg: '#fff3cd', color: '#856404', border: '#ffc107' },
  confirmado:  { bg: '#d1ecf1', color: '#0c5460', border: '#17a2b8' },
  realizado:   { bg: '#d4edda', color: '#155724', border: '#28a745' },
  cancelado:   { bg: '#f8d7da', color: '#721c24', border: '#dc3545' }
}

export default function TurnosList() {
  const { usuario } = useAuth()

  // Estado de la lista de turnos y paginación
  const [turnos, setTurnos] = useState([])
  const [pagination, setPagination] = useState({})
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  // Estado de los filtros del formulario
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroFecha, setFiltroFecha] = useState('')
  const [pagina, setPagina] = useState(1)

  // useEffect se ejecuta cuando cambian las dependencias del array [ ]
  // Aquí se ejecuta cuando cambia pagina, filtroEstado o filtroFecha
  useEffect(() => {
    cargarTurnos()
  }, [pagina, filtroEstado, filtroFecha])

  async function cargarTurnos() {
    setCargando(true)
    setError('')
    try {
      // Armamos el objeto de filtros — solo incluimos los que tienen valor
      const filtros = { page: pagina, limit: 10 }
      if (filtroEstado) filtros.estado = filtroEstado
      if (filtroFecha) filtros.fecha = filtroFecha

      const data = await turnosService.listar(filtros)
      // data tiene: { data: [...turnos], pagination: { page, limit, total, totalPages } }
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
    setPagina(1)  // Al filtrar, volvemos a la página 1
    cargarTurnos()
  }

  function handleLimpiar() {
    setFiltroEstado('')
    setFiltroFecha('')
    setPagina(1)
  }

  const estiloEstado = (estado) => COLORES_ESTADO[estado] || {}

  return (
    <div style={{ maxWidth: '1000px', margin: '24px auto', padding: '0 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>📋 Mis Turnos</h2>
        {(usuario?.rol === 'estudiante' || usuario?.rol === 'admin') && (
          <Link
            to="/turnos/nuevo"
            style={{ background: '#27ae60', color: 'white', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none' }}
          >
            + Nuevo Turno
          </Link>
        )}
      </div>

      {/* Formulario de filtros */}
      <form onSubmit={handleFiltrar} style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Estado</label>
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
            <option value="">Todos</option>
            <option value="solicitado">Solicitado</option>
            <option value="confirmado">Confirmado</option>
            <option value="realizado">Realizado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Fecha</label>
          <input
            type="date"
            value={filtroFecha}
            onChange={e => setFiltroFecha(e.target.value)}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>

        <button type="submit" style={{ padding: '8px 16px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Filtrar
        </button>
        <button type="button" onClick={handleLimpiar} style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Limpiar
        </button>
      </form>

      {/* Mensajes de estado */}
      {error && <div style={{ color: '#c00', padding: '12px', background: '#fee', borderRadius: '4px', marginBottom: '16px' }}>⚠️ {error}</div>}
      {cargando && <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Cargando...</div>}

      {/* Lista de turnos */}
      {!cargando && !error && (
        <>
          {turnos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              No hay turnos que mostrar.
            </div>
          ) : (
            <div>
              {turnos.map(turno => {
                const estilo = estiloEstado(turno.estado)
                return (
                  <div
                    key={turno.id}
                    style={{
                      border: `1px solid ${estilo.border || '#ddd'}`,
                      borderLeft: `4px solid ${estilo.border || '#ddd'}`,
                      borderRadius: '6px',
                      padding: '16px',
                      marginBottom: '12px',
                      background: estilo.bg || 'white',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                        📅 {turno.fecha} · {turno.horaInicio} - {turno.horaFin}
                      </div>
                      <div style={{ fontSize: '14px', color: '#444', marginBottom: '4px' }}>
                        👨‍🏫 Tutor ID: {turno.tutorId} · Tema: {turno.tema}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        Modalidad: {turno.modalidad}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <span style={{
                        background: estilo.bg,
                        color: estilo.color,
                        border: `1px solid ${estilo.border}`,
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 'bold'
                      }}>
                        {turno.estado}
                      </span>
                      <Link
                        to={`/turnos/${turno.id}`}
                        style={{ color: '#3498db', textDecoration: 'none', fontSize: '14px' }}
                      >
                        Ver detalle →
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Paginación */}
          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
              <button
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={pagina === 1}
                style={{ padding: '8px 16px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '4px', background: pagina === 1 ? '#f0f0f0' : 'white' }}
              >
                ← Anterior
              </button>
              <span style={{ padding: '8px 16px', color: '#666' }}>
                Página {pagina} de {pagination.totalPages} · {pagination.total} turnos en total
              </span>
              <button
                onClick={() => setPagina(p => Math.min(pagination.totalPages, p + 1))}
                disabled={pagina === pagination.totalPages}
                style={{ padding: '8px 16px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '4px', background: pagina === pagination.totalPages ? '#f0f0f0' : 'white' }}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
