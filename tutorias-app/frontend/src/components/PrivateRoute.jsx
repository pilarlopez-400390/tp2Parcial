// src/components/PrivateRoute.jsx
// Componente que protege rutas.

import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PrivateRoute({ children, roles = [] }) {
  const { usuario, cargando } = useAuth()

  if (cargando) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Cargando...</div>
  }

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  const userRole = usuario?.rol
  if (roles.length > 0 && !roles.includes(userRole)) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 24px', color: '#182230' }}>
        <h2>Acceso denegado</h2>
        <p style={{ color: '#667085' }}>No tenes permisos para ver esta pagina.</p>
        <p>Tu rol: <strong>{userRole || 'sin sesion'}</strong></p>
        <p>Roles requeridos: <strong>{roles.join(', ')}</strong></p>
      </div>
    )
  }

  return children
}
