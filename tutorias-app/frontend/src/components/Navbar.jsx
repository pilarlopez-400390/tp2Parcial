// src/components/Navbar.jsx
// Barra de navegacion siempre visible arriba.

import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { usuario, logout, cargando } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const linkStyle = { color: '#d6e2e8', textDecoration: 'none', fontWeight: '600', fontSize: '14px' }

  if (cargando) {
    return <nav style={{ background: '#183746', padding: '14px 28px', color: 'white' }}><div style={{ textAlign: 'center' }}>Cargando...</div></nav>
  }

  return (
    <nav style={{ background: '#183746', padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', boxShadow: '0 1px 0 rgba(255,255,255,0.08)', gap: '18px', flexWrap: 'wrap' }}>
      <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: '800', fontSize: '18px', letterSpacing: '0.01em' }}>
        Tutorías Desarrollo de Software
      </Link>

      <div style={{ display: 'flex', gap: '18px', alignItems: 'center', flexWrap: 'wrap' }}>
        {usuario ? (
          <>
            <Link to="/turnos" style={linkStyle}>Turnos</Link>

            {(usuario.rol === 'estudiante' || usuario.rol === 'admin') && (
              <Link to="/turnos/nuevo" style={linkStyle}>Nuevo Turno</Link>
            )}

            {usuario.rol === 'admin' && (
              <>
                <Link to="/admin/usuarios" style={linkStyle}>Usuarios</Link>
                <Link to="/resumen" style={linkStyle}>Panel Administrativo</Link>
              </>
            )}

            <span style={{ color: '#aec4cf', fontSize: '14px' }}>
              {usuario.nombre} ({usuario.rol})
            </span>

            <button
              onClick={handleLogout}
              style={{ background: '#ffffff', color: '#183746', border: '1px solid rgba(255,255,255,0.22)', padding: '7px 12px', borderRadius: '6px', cursor: 'pointer' }}
            >
              Cerrar Sesión
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={linkStyle}>Login</Link>
            <Link to="/register" style={linkStyle}>Registrarse</Link>
          </>
        )}
      </div>
    </nav>
  )
}
