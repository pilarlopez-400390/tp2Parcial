// src/pages/ResumenAdmin.jsx
// Panel de estadísticas para el rol admin.
// Muestra: turnos hoy, pendientes, por tutor y temas más solicitados.

import { useState, useEffect } from 'react'
import turnosService from '../services/turnosService'

export default function ResumenAdmin() {
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  // Se ejecuta al montar el componente (el [] vacío garantiza que solo se ejecuta una vez)
  useEffect(() => {
    cargarResumen()
  }, [])

  async function cargarResumen() {
    try {
      const data = await turnosService.resumen()
      setDatos(data)
    } catch (err) {
      setError('Error al cargar el resumen')
    } finally {
      setCargando(false)
    }
  }

  if (cargando) return <div style={{ textAlign: 'center', padding: '60px' }}>Cargando resumen...</div>
  if (error) return <div style={{ textAlign: 'center', padding: '60px', color: '#c00' }}>⚠️ {error}</div>
  if (!datos) return null

  // Estilo para cada tarjeta de estadística
  const tarjeta = (titulo, valor, color) => (
    <div style={{ background: color, borderRadius: '8px', padding: '24px', textAlign: 'center', minWidth: '150px' }}>
      <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px' }}>{valor}</div>
      <div style={{ fontSize: '14px', color: '#444' }}>{titulo}</div>
    </div>
  )

  return (
    <div style={{ maxWidth: '900px', margin: '24px auto', padding: '0 16px' }}>
      <h2 style={{ marginBottom: '24px' }}>📊 Panel de Administración</h2>

      {/* Tarjetas de métricas */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
        {tarjeta('Turnos hoy', datos.turnosHoy, '#fff3cd')}
        {tarjeta('Pendientes', datos.turnosPendientes, '#d1ecf1')}
        {tarjeta('Total', datos.totalTurnos || '—', '#f8f9fa')}
      </div>

      {/* Turnos por tutor */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ marginBottom: '12px' }}>👨‍🏫 Turnos por tutor</h3>
        {datos.turnosPorTutor && datos.turnosPorTutor.length > 0 ? (
          <div style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
            {datos.turnosPorTutor.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 20px',
                  borderBottom: idx < datos.turnosPorTutor.length - 1 ? '1px solid #eee' : 'none',
                  background: idx % 2 === 0 ? 'white' : '#f8f9fa'
                }}
              >
                <span>{item.nombre}</span>
                {/* La barra de progreso visual */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '100px', height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        background: '#3498db',
                        width: `${Math.min(100, (item.cantidad / (datos.turnosPorTutor[0]?.cantidad || 1)) * 100)}%`
                      }}
                    />
                  </div>
                  <strong>{item.cantidad}</strong>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#666' }}>Sin datos disponibles.</p>
        )}
      </div>

      {/* Temas más solicitados */}
      <div>
        <h3 style={{ marginBottom: '12px' }}>🏷️ Temas más solicitados</h3>
        {datos.temasMasSolicitados && datos.temasMasSolicitados.length > 0 ? (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {datos.temasMasSolicitados.map((item, idx) => (
              <span
                key={idx}
                style={{
                  background: '#e8f4fd',
                  border: '1px solid #bee5eb',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '14px'
                }}
              >
                {item.tema} <strong>({item.cantidad})</strong>
              </span>
            ))}
          </div>
        ) : (
          <p style={{ color: '#666' }}>Sin datos disponibles.</p>
        )}
      </div>
    </div>
  )
}
