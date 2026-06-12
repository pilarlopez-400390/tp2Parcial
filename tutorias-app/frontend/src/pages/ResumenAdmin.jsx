// src/pages/ResumenAdmin.jsx
// Panel de estadisticas para administradores.

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import turnosService from '../services/turnosService'

const ESTADOS = {
  solicitado: { label: 'Pendiente', bg: '#fff4df', color: '#8a5b13', border: '#efd49d' },
  confirmado: { label: 'Confirmado', bg: '#e8f2f6', color: '#245b73', border: '#b8d4df' },
  realizado: { label: 'Realizado', bg: '#e9f5ef', color: '#2f6f58', border: '#b8ddcd' },
  cancelado: { label: 'Cancelado', bg: '#f9eaea', color: '#9f3a3a', border: '#efc7c7' }
}

function fechaHoyLocal() {
  const hoy = new Date()
  const yyyy = hoy.getFullYear()
  const mm = String(hoy.getMonth() + 1).padStart(2, '0')
  const dd = String(hoy.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function ResumenAdmin() {
  const [datos, setDatos] = useState(null)
  const [turnosDetalle, setTurnosDetalle] = useState([])
  const [vistaActiva, setVistaActiva] = useState('hoy')
  const [tituloDetalle, setTituloDetalle] = useState('Turnos de hoy')
  const [temaActivo, setTemaActivo] = useState('')
  const [cargando, setCargando] = useState(true)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    cargarResumen()
  }, [])

  async function cargarResumen() {
    try {
      setCargando(true)
      const data = await turnosService.resumen()
      setDatos(data)
      await cargarDetalle('hoy')
    } catch (err) {
      setError('Error al cargar el resumen')
    } finally {
      setCargando(false)
    }
  }

  function temasDelTurno(turno) {
    if (Array.isArray(turno.temas) && turno.temas.length > 0) return turno.temas
    return turno.tema ? [turno.tema] : ['Sin Tema']
  }

  function categoriaDelTurno(turno) {
    return formatearEtiqueta(turno.categoria || turno.tutorEspecialidad, 'Sin Categoría')
  }

  function formatearEtiqueta(valor, fallback = 'Sin dato') {
    if (!valor) return fallback
    const normalizadas = {
      backend: 'Backend',
      frontend: 'Frontend',
      testing: 'Testing',
      seguridad: 'Seguridad'
    }
    const texto = String(valor).trim()
    return normalizadas[texto.toLowerCase()] || texto.charAt(0).toUpperCase() + texto.slice(1)
  }

  async function cargarDetalle(tipo, tema = '', categoria = '') {
    setCargandoDetalle(true)
    setVistaActiva(tipo)
    setTemaActivo(categoria ? `${categoria}::${tema}` : tema)

    try {
      const filtros = { page: 1, limit: 100 }
      if (tipo === 'hoy') {
        filtros.fecha = fechaHoyLocal()
        setTituloDetalle('Turnos de hoy')
      }
      if (tipo === 'pendientes') {
        filtros.estado = 'solicitado'
        setTituloDetalle('Turnos pendientes')
      }
      if (tipo === 'total') {
        setTituloDetalle('Todos los turnos')
      }
      if (tipo === 'tema') {
        setTituloDetalle(categoria ? `Turnos de ${categoria} sobre "${tema}"` : `Turnos sobre "${tema}"`)
      }

      const respuesta = await turnosService.listar(filtros)
      const lista = tipo === 'tema'
        ? respuesta.data.filter(turno => temasDelTurno(turno).includes(tema) && (!categoria || categoriaDelTurno(turno) === categoria))
        : respuesta.data

      setTurnosDetalle(lista)
    } catch (err) {
      setError('Error al cargar los turnos del resumen')
    } finally {
      setCargandoDetalle(false)
    }
  }

  function tarjeta(titulo, valor, tipo, tono) {
    const activa = vistaActiva === tipo

    return (
      <button
        type="button"
        onClick={() => cargarDetalle(tipo)}
        style={{
          background: activa ? tono.activo : '#fff',
          border: activa ? `2px solid ${tono.borde}` : '1px solid #d9e2ec',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'left',
          minWidth: '180px',
          cursor: 'pointer',
          boxShadow: '0 12px 28px rgba(16, 24, 40, 0.06)'
        }}
      >
        <div style={{ fontSize: '32px', fontWeight: '800', color: '#182230', marginBottom: '6px' }}>{valor}</div>
        <div style={{ fontSize: '14px', color: '#475467', fontWeight: '600' }}>{titulo}</div>
      </button>
    )
  }

  function renderTurno(turno) {
    const estado = ESTADOS[turno.estado] || ESTADOS.solicitado
    const temasTurno = temasDelTurno(turno)
    const categoriaTurno = categoriaDelTurno(turno)

    return (
      <div key={turno.id} style={{ border: '1px solid #d9e2ec', borderRadius: '8px', padding: '14px 16px', background: '#fff', display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'center' }}>
        <div>
          <strong style={{ color: '#111827' }}>{turno.fecha} - {turno.horaInicio} a {turno.horaFin}</strong>
          <p style={{ margin: '6px 0 0', color: '#475467' }}>{categoriaTurno}: {temasTurno.join(', ')}</p>
          <p style={{ margin: '4px 0 0', color: '#667085', fontSize: '14px' }}>
            Tutor: {turno.tutorNombre || `Tutor ${turno.tutorId}`} · Estudiante: {turno.estudianteNombre || `#${turno.estudianteId}`}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ display: 'inline-block', background: estado.bg, color: estado.color, border: `1px solid ${estado.border}`, borderRadius: '999px', padding: '5px 10px', fontWeight: '700', fontSize: '13px', marginBottom: '8px' }}>
            {estado.label}
          </span>
          <div>
            <Link to={`/turnos/${turno.id}`} style={{ fontSize: '14px', textDecoration: 'none', fontWeight: '600' }}>Ver detalle</Link>
          </div>
        </div>
      </div>
    )
  }

  if (cargando) return <div style={{ textAlign: 'center', padding: '60px' }}>Cargando resumen...</div>
  if (error) return <div style={{ textAlign: 'center', padding: '60px', color: '#9f3a3a' }}>{error}</div>
  if (!datos) return null

  const temasPorCategoria = datos.temasPorCategoria || datos.temasPorEspecialidad || []
  const turnosPorTutor = datos.turnosPorTutor || []
  const maxTurnosTutor = turnosPorTutor[0]?.cantidad || 1

  return (
    <div style={{ maxWidth: '1100px', margin: '24px auto', padding: '0 16px' }}>
      <h2 style={{ marginBottom: '20px', color: '#182230', fontSize: '28px' }}>Panel de administracion</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        {tarjeta('Turnos hoy', datos.turnosHoy, 'hoy', { activo: '#fff4df', borde: '#8a5b13' })}
        {tarjeta('Pendientes', datos.turnosPendientes, 'pendientes', { activo: '#e8f2f6', borde: '#245b73' })}
        {tarjeta('Total', datos.totalTurnos || 0, 'total', { activo: '#f6f8fb', borde: '#667085' })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 0.9fr) minmax(320px, 1.1fr)', gap: '18px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <section style={{ border: '1px solid #d9e2ec', borderRadius: '8px', padding: '18px', background: '#fff', boxShadow: '0 12px 28px rgba(16, 24, 40, 0.06)' }}>
            <h3 style={{ margin: '0 0 14px', color: '#111827' }}>Turnos por tutor</h3>
            {turnosPorTutor.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {turnosPorTutor.map(item => (
                  <div key={item.nombre}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontWeight: '700', color: '#111827' }}>{item.nombre}</span>
                      <strong>{item.cantidad}</strong>
                    </div>
                    <div style={{ height: '8px', background: '#eef2f7', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.max(8, (item.cantidad / maxTurnosTutor) * 100)}%`, background: '#245b73' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#667085' }}>Sin datos disponibles.</p>
            )}
          </section>

          <section style={{ border: '1px solid #d9e2ec', borderRadius: '8px', padding: '18px', background: '#fff', boxShadow: '0 12px 28px rgba(16, 24, 40, 0.06)' }}>
            <h3 style={{ margin: '0 0 14px', color: '#111827' }}>Temas Más Solicitados por Categoría</h3>
            {temasPorCategoria.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {temasPorCategoria.map(grupo => {
                  const categoria = formatearEtiqueta(grupo.categoria || grupo.especialidad, 'Sin Categoría')
                  const maxTemaGrupo = grupo.temas[0]?.cantidad || 1

                  return (
                    <div key={categoria} style={{ border: '1px solid #d9e2ec', borderRadius: '8px', padding: '12px', background: '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
                        <strong style={{ textTransform: 'capitalize' }}>{categoria}</strong>
                        <span style={{ color: '#667085', fontSize: '13px' }}>{grupo.total} Temas Seleccionados</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {grupo.temas.map((item, idx) => {
                          const activo = vistaActiva === 'tema' && temaActivo === `${categoria}::${item.tema}`

                          return (
                            <button
                              key={`${categoria}-${item.tema}-${idx}`}
                              type="button"
                              onClick={() => cargarDetalle('tema', item.tema, categoria)}
                              style={{
                                border: activo ? '2px solid #245b73' : '1px solid #d9e2ec',
                                background: activo ? '#e8f2f6' : '#fff',
                                borderRadius: '8px',
                                padding: '10px',
                                textAlign: 'left',
                                cursor: 'pointer'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' }}>
                                <span>{item.tema}</span>
                                <strong>{item.cantidad}</strong>
                              </div>
                              <div style={{ height: '8px', background: '#eef2f7', borderRadius: '999px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${Math.max(8, (item.cantidad / maxTemaGrupo) * 100)}%`, background: '#245b73' }} />
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p style={{ color: '#667085' }}>Sin datos disponibles.</p>
            )}
          </section>
        </div>

        <section style={{ border: '1px solid #d9e2ec', borderRadius: '8px', padding: '18px', background: '#fff', boxShadow: '0 12px 28px rgba(16, 24, 40, 0.06)' }}>
          <h3 style={{ margin: '0 0 14px', color: '#111827' }}>{tituloDetalle}</h3>
          {cargandoDetalle ? (
            <p style={{ color: '#667085' }}>Cargando turnos...</p>
          ) : turnosDetalle.length === 0 ? (
            <p style={{ color: '#667085' }}>No hay turnos para mostrar.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {turnosDetalle.map(renderTurno)}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
