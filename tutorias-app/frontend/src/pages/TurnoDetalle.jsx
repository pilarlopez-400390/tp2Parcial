// src/pages/TurnoDetalle.jsx
// Muestra el detalle completo de un turno y permite realizar acciones

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import turnosService from '../services/turnosService'

export default function TurnoDetalle() {
  // useParams() extrae los parámetros de la URL
  // En la ruta /turnos/:id, si la URL es /turnos/5, entonces params.id = "5"
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario } = useAuth()

  const [turno, setTurno] = useState(null)
  const [historial, setHistorial] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [accionCargando, setAccionCargando] = useState(false)
  const [observaciones, setObservaciones] = useState('')
  const [mostrarHistorial, setMostrarHistorial] = useState(false)
  const [historialError, setHistorialError] = useState('')

  // Cargamos el turno cuando el componente se monta (o cuando cambia el id)
  useEffect(() => {
    cargarTurno()
  }, [id])

  async function cargarTurno() {
    setCargando(true)
    try {
      const data = await turnosService.obtener(parseInt(id))
      setTurno(data)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar el turno')
    } finally {
      setCargando(false)
    }
  }

  async function cargarHistorial() {
    try {
      setHistorialError('')
      const data = await turnosService.historial(parseInt(id))
      setHistorial(data)
      setMostrarHistorial(true)
    } catch (err) {
      setHistorialError(err.response?.data?.error || 'Error al cargar el historial')
      setMostrarHistorial(true)
    }
  }

  // Función genérica para ejecutar acciones de cambio de estado
  async function ejecutarAccion(accion) {
    setAccionCargando(true)
    try {
      let data
      if (accion === 'realizar') {
        data = await turnosService.realizar(parseInt(id), observaciones)
      } else if (accion === 'confirmar') {
        data = await turnosService.confirmar(parseInt(id))
      } else if (accion === 'cancelar') {
        data = await turnosService.cancelar(parseInt(id))
      }
      setTurno(data)  // Actualizamos el estado local con el nuevo turno
    } catch (err) {
      setError(err.response?.data?.error || `Error al ${accion} el turno`)
    } finally {
      setAccionCargando(false)
    }
  }

  // ¿Puede este usuario confirmar este turno?
  function puedeConfirmar() {
    if (turno?.estado !== 'solicitado') return false
    if (usuario?.rol === 'admin') return true
    return usuario?.rol === 'tutor' && turno?.tutorUsuarioId === usuario?.id
  }

  function puedeRealizar() {
    if (turno?.estado !== 'confirmado') return false
    if (usuario?.rol === 'admin') return true
    return usuario?.rol === 'tutor' && turno?.tutorUsuarioId === usuario?.id
  }

  function puedeCancelar() {
    if (turno?.estado !== 'solicitado' && turno?.estado !== 'confirmado') return false
    if (usuario?.rol === 'admin') return true
    return usuario?.rol === 'estudiante' && turno?.estudianteId === usuario?.id
  }

  // Determinamos si el usuario puede editar
  function puedeEditar() {
    return usuario?.rol === 'admin' && turno?.estado !== 'realizado' && turno?.estado !== 'cancelado'
  }

  const COLORES = {
    solicitado: '#fff3cd',
    confirmado: '#d1ecf1',
    realizado: '#d4edda',
    cancelado: '#f8d7da'
  }

  if (cargando) return <div style={{ textAlign: 'center', padding: '60px' }}>Cargando...</div>
  if (error) return <div style={{ textAlign: 'center', padding: '60px', color: '#c00' }}>⚠️ {error}</div>
  if (!turno) return null

  const temasTurno = Array.isArray(turno.temas) && turno.temas.length > 0
    ? turno.temas
    : (turno.tema ? [turno.tema] : [])
  const categoriaTurno = turno.categoria || turno.tutorEspecialidad || 'Sin categoria'

  return (
    <div style={{ maxWidth: '700px', margin: '24px auto', padding: '0 16px' }}>
      {/* Header con botón volver */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>📋 Turno #{turno.id}</h2>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: '1px solid #ddd', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
          ← Volver
        </button>
      </div>

      {/* Tarjeta principal */}
      <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '24px', background: COLORES[turno.estado] || 'white', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <strong>Estado</strong>
            <p style={{ margin: '4px 0', fontWeight: 'bold', textTransform: 'uppercase' }}>{turno.estado}</p>
          </div>
          <div>
            <strong>Fecha</strong>
            <p style={{ margin: '4px 0' }}>{turno.fecha}</p>
          </div>
          <div>
            <strong>Horario</strong>
            <p style={{ margin: '4px 0' }}>{turno.horaInicio} - {turno.horaFin}</p>
          </div>
          <div>
            <strong>Tutor</strong>
            <p style={{ margin: '4px 0' }}>{turno.tutorNombre || `Tutor ${turno.tutorId}`}</p>
          </div>
          <div>
            <strong>Especialidad del tutor</strong>
            <p style={{ margin: '4px 0' }}>{turno.tutorEspecialidad || 'Sin especialidad'}</p>
          </div>
          <div>
            <strong>Categoria</strong>
            <p style={{ margin: '4px 0' }}>{categoriaTurno}</p>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <strong>Tema/temas seleccionados</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {temasTurno.map(tema => (
                <span key={tema} style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '999px', padding: '5px 10px', fontSize: '13px', fontWeight: '700', color: '#334155' }}>
                  {tema}
                </span>
              ))}
            </div>
          </div>
          <div>
            <strong>Modalidad</strong>
            <p style={{ margin: '4px 0' }}>{turno.modalidad}</p>
          </div>
          {turno.observaciones && (
            <div style={{ gridColumn: '1 / -1' }}>
              <strong>Observaciones</strong>
              <p style={{ margin: '4px 0' }}>{turno.observaciones}</p>
            </div>
          )}
        </div>
      </div>

      {/* Acciones */}
      {error && (
        <div style={{ color: '#c00', padding: '12px', background: '#fee', borderRadius: '4px', marginBottom: '16px' }}>
          ⚠️ {error}
          <button onClick={() => setError('')} style={{ marginLeft: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#c00' }}>✕</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {puedeEditar() && (
          <Link
            to={`/turnos/${turno.id}/editar`}
            style={{ background: '#3498db', color: 'white', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none' }}
          >
            ✏️ Editar
          </Link>
        )}

        {puedeConfirmar() && (
          <button
            onClick={() => ejecutarAccion('confirmar')}
            disabled={accionCargando}
            style={{ background: '#17a2b8', color: 'white', padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
          >
            ✅ Confirmar
          </button>
        )}

        {puedeRealizar() && (
          <button
            onClick={() => ejecutarAccion('realizar')}
            disabled={accionCargando}
            style={{ background: '#28a745', color: 'white', padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
          >
            🎓 Marcar como realizado
          </button>
        )}

        {puedeCancelar() && (
          <button
            onClick={() => { if (confirm('¿Cancelar este turno?')) ejecutarAccion('cancelar') }}
            disabled={accionCargando}
            style={{ background: '#dc3545', color: 'white', padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
          >
            ❌ Cancelar
          </button>
        )}
      </div>

      {/* Campo observaciones para acción "realizar" */}
      {puedeRealizar() && (
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            Observaciones (al marcar como realizado):
          </label>
          <textarea
            value={observaciones}
            onChange={e => setObservaciones(e.target.value)}
            rows={3}
            placeholder="Observaciones sobre la tutoría..."
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
          />
        </div>
      )}

      {/* Historial */}
      <div>
        <button
          onClick={mostrarHistorial ? () => setMostrarHistorial(false) : cargarHistorial}
          style={{ background: 'none', border: '1px solid #ddd', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', marginBottom: '12px' }}
        >
          {mostrarHistorial ? '▲ Ocultar historial' : '▼ Ver historial de cambios'}
        </button>

        {mostrarHistorial && !historialError && historial.length === 0 && (
          <p style={{ color: '#888', fontSize: '14px' }}>Sin registros en el historial.</p>
        )}

        {mostrarHistorial && historialError && (
          <p style={{ color: '#c00', fontSize: '14px', background: '#fee', border: '1px solid #fcc', borderRadius: '4px', padding: '10px' }}>
            {historialError}
          </p>
        )}

        {mostrarHistorial && !historialError && historial.length > 0 && (
          <div style={{ border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden' }}>
            {historial.map((entrada, idx) => {
              let anterior = null
              let nuevo = null
              try { anterior = entrada.valorAnterior ? JSON.parse(entrada.valorAnterior) : null } catch {}
              try { nuevo = entrada.valorNuevo ? JSON.parse(entrada.valorNuevo) : null } catch {}

              const etiquetas = {
                creacion: 'Creación',
                edicion: 'Edición',
                reasignacion: 'Reasignación',
                confirmacion: 'Confirmación',
                cancelacion: 'Cancelación',
                realizacion: 'Realización'
              }

              return (
                <div key={idx} style={{ padding: '12px 16px', borderBottom: idx < historial.length - 1 ? '1px solid #eee' : 'none', fontSize: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ color: '#888', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {new Date(entrada.fechaHora).toLocaleString('es-AR')}
                    </span>
                    <strong style={{ color: '#2c3e50' }}>
                      {etiquetas[entrada.accion] || entrada.accion}
                    </strong>
                    {entrada.usuarioNombre && (
                      <span style={{ color: '#555' }}>por <em>{entrada.usuarioNombre}</em></span>
                    )}
                  </div>

                  {(anterior || nuevo) && (
                    <div style={{ marginTop: '6px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {anterior && (
                        <div style={{ background: '#ffeef0', border: '1px solid #fcc', borderRadius: '4px', padding: '4px 8px', fontSize: '12px' }}>
                          <span style={{ color: '#c00', fontWeight: 'bold' }}>Antes: </span>
                          {Object.entries(anterior).map(([k, v]) => (
                            <span key={k} style={{ marginRight: '8px', color: '#555' }}>{k}: <strong>{String(v)}</strong></span>
                          ))}
                        </div>
                      )}
                      {nuevo && (
                        <div style={{ background: '#eafaf1', border: '1px solid #aed6f1', borderRadius: '4px', padding: '4px 8px', fontSize: '12px' }}>
                          <span style={{ color: '#27ae60', fontWeight: 'bold' }}>Después: </span>
                          {Object.entries(nuevo).map(([k, v]) => (
                            <span key={k} style={{ marginRight: '8px', color: '#555' }}>{k}: <strong>{String(v)}</strong></span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
