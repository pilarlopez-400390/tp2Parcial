// src/components/PrivateRoute.jsx
// Componente que protege rutas — si no hay usuario logueado, redirige al login.
//
// Uso en App.jsx:
//   <Route path="/turnos" element={<PrivateRoute><TurnosList /></PrivateRoute>} />
//   <Route path="/resumen" element={<PrivateRoute roles={['admin']}><ResumenAdmin /></PrivateRoute>} />
//
// Esto evita que alguien navegue a /turnos sin estar logueado.
// IMPORTANTE: esto es protección VISUAL. La verdadera protección está en el backend.

import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// roles: array de roles permitidos — si no se pasa, cualquier usuario autenticado puede entrar
export default function PrivateRoute({ children, roles = [] }) {
  const { usuario, cargando } = useAuth()

  // Mientras cargamos del localStorage, mostramos un spinner para no redirigir prematuramente
  if (cargando) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Cargando...</div>
  }

  // Si no hay usuario → redirigir al login
  // <Navigate replace /> hace una redirección (replace evita que quede en el historial)
  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  // Si se especificaron roles y el usuario no tiene el rol requerido → 403 visual
  const userRole = usuario?.rol
  if (roles.length > 0 && !roles.includes(userRole)) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h2>⛔ Acceso denegado</h2>
        <p>No tenés permisos para ver esta página.</p>
        <p>Tu rol: <strong>{userRole || 'sin sesión'}</strong></p>
        <p>Roles requeridos: <strong>{roles.join(', ')}</strong></p>
      </div>
    )
  }

  // Si todo está bien, renderizamos el componente hijo
  return children
}
