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
      if (accion === 'confirmar') {
        data = await turnosService.confirmar(parseInt(id))
      } else if (accion === 'cancelar') {
        const motivo = prompt('Indicá el motivo de cancelación:')
        if (motivo === null) {
          setAccionCargando(false)
          return
        }
        if (!motivo.trim()) {
          setError('Indicá el motivo de cancelación')
          setAccionCargando(false)
          return
        }
        data = await turnosService.cancelar(parseInt(id), motivo.trim())
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
    solicitado: '#fff4df',
    confirmado: '#e8f2f6',
    realizado: '#e9f5ef',
    cancelado: '#f9eaea'
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

  if (cargando) return <div style={{ textAlign: 'center', padding: '60px' }}>Cargando...</div>
  if (error) return <div style={{ textAlign: 'center', padding: '60px', color: '#9f3a3a' }}>{error}</div>
  if (!turno) return null

  const temasTurno = Array.isArray(turno.temas) && turno.temas.length > 0
    ? turno.temas
    : (turno.tema ? [turno.tema] : [])
  const categoriaTurno = formatearEtiqueta(turno.categoria || turno.tutorEspecialidad, 'Sin Categoría')
  const especialidadTutor = formatearEtiqueta(turno.tutorEspecialidad, 'Sin Especialidad')

  return (
    <div style={{ maxWidth: '700px', margin: '24px auto', padding: '0 16px' }}>
      {/* Header con botón volver */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: '#182230' }}>Turno #{turno.id}</h2>
        <button onClick={() => navigate(-1)} style={{ background: '#fff', border: '1px solid #d9e2ec', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', color: '#344054' }}>
          Volver
        </button>
      </div>

      {/* Tarjeta principal */}
      <div style={{ border: '1px solid #d9e2ec', borderRadius: '8px', padding: '24px', background: COLORES[turno.estado] || 'white', marginBottom: '24px', boxShadow: '0 12px 28px rgba(16, 24, 40, 0.06)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <strong>Estado</strong>
            <p style={{ margin: '4px 0', fontWeight: 'bold' }}>{formatearEtiqueta(turno.estado)}</p>
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
            <p style={{ margin: '4px 0' }}>{especialidadTutor}</p>
          </div>
          <div>
            <strong>Categoría</strong>
            <p style={{ margin: '4px 0' }}>{categoriaTurno}</p>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <strong>Tema/Temas Seleccionados</strong>
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
            <p style={{ margin: '4px 0' }}>{formatearEtiqueta(turno.modalidad)}</p>
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
        <div style={{ color: '#9f3a3a', padding: '12px', background: '#f9eaea', borderRadius: '6px', marginBottom: '16px', border: '1px solid #efc7c7' }}>
          {error}
          <button onClick={() => setError('')} style={{ marginLeft: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#9f3a3a' }}>Cerrar</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {puedeEditar() && (
          <Link
            to={`/turnos/${turno.id}/editar`}
            style={{ background: '#245b73', color: 'white', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', fontWeight: '800' }}
          >
            Editar
          </Link>
        )}

        {puedeConfirmar() && (
          <button
            onClick={() => ejecutarAccion('confirmar')}
            disabled={accionCargando}
            style={{ background: '#245b73', color: 'white', padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
          >
            Confirmar
          </button>
        )}

        {puedeCancelar() && (
          <button
            onClick={() => ejecutarAccion('cancelar')}
            disabled={accionCargando}
            style={{ background: '#9f3a3a', color: 'white', padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
          >
            Cancelar
          </button>
        )}
      </div>

      {/* Historial */}
      <div>
        <button
          onClick={mostrarHistorial ? () => setMostrarHistorial(false) : cargarHistorial}
          style={{ background: 'none', border: '1px solid #ddd', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', marginBottom: '12px' }}
        >
          {mostrarHistorial ? 'Ocultar Historial' : 'Ver Historial de Cambios'}
        </button>

        {mostrarHistorial && !historialError && historial.length === 0 && (
          <p style={{ color: '#888', fontSize: '14px' }}>Sin registros en el historial.</p>
        )}

        {mostrarHistorial && historialError && (
          <p style={{ color: '#9f3a3a', fontSize: '14px', background: '#f9eaea', border: '1px solid #efc7c7', borderRadius: '6px', padding: '10px' }}>
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
                        <div style={{ background: '#f9eaea', border: '1px solid #efc7c7', borderRadius: '6px', padding: '4px 8px', fontSize: '12px' }}>
                          <span style={{ color: '#9f3a3a', fontWeight: 'bold' }}>Antes: </span>
                          {Object.entries(anterior).map(([k, v]) => (
                            <span key={k} style={{ marginRight: '8px', color: '#555' }}>{k}: <strong>{String(v)}</strong></span>
                          ))}
                        </div>
                      )}
                      {nuevo && (
                        <div style={{ background: '#eafaf1', border: '1px solid #aed6f1', borderRadius: '4px', padding: '4px 8px', fontSize: '12px' }}>
                          <span style={{ color: '#2f6f58', fontWeight: 'bold' }}>Después: </span>
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
