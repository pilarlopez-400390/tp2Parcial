// src/components/Navbar.jsx
// Barra de navegación — siempre visible arriba

import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// useNavigate es el hook de React Router para navegar programáticamente
// (a diferencia de <Link> que es un enlace en el HTML)
export default function Navbar() {
  const { usuario, logout, cargando } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')  // Redirige al login después de cerrar sesión
  }

  if (cargando) {
    return <nav style={{ background: '#1a1a2e', padding: '12px 24px', color: 'white' }}><div style={{ textAlign: 'center' }}>Cargando...</div></nav>
  }

  return (
    <nav style={{ background: '#1a1a2e', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
      <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '18px' }}>
        📚 Tutorías DDS
      </Link>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        {/* Mostramos links según si hay usuario logueado */}
        {usuario ? (
          <>
            <Link to="/turnos" style={{ color: '#ccc', textDecoration: 'none' }}>Turnos</Link>

            {/* Solo admins ven el panel de resumen */}
            {usuario.rol === 'admin' && (
              <>
                <Link to="/resumen" style={{ color: '#ccc', textDecoration: 'none' }}>Panel Admin</Link>
                <Link to="/admin/usuarios" style={{ color: '#ccc', textDecoration: 'none' }}>Usuarios</Link>
              </>
            )}

            {/* Solo estudiantes y admins pueden crear turnos */}
            {(usuario.rol === 'estudiante' || usuario.rol === 'admin') && (
              <Link to="/turnos/nuevo" style={{ color: '#ccc', textDecoration: 'none' }}>Nuevo Turno</Link>
            )}

            <span style={{ color: '#888', fontSize: '14px' }}>
              {usuario.nombre} ({usuario.rol})
            </span>

            <button
              onClick={handleLogout}
              style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
            >
              Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ color: '#ccc', textDecoration: 'none' }}>Login</Link>
            <Link to="/register" style={{ color: '#ccc', textDecoration: 'none' }}>Registrarse</Link>
          </>
        )}
      </div>
    </nav>
  )
}
