// src/components/Navbar.jsx
// Barra de navegacion siempre visible arriba.

import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { usuario, logout, cargando } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function linkStyle(path, exact = false) {
    let activo = exact ? location.pathname === path : location.pathname.startsWith(path)
    if (path === '/turnos') {
      activo = location.pathname === '/turnos' || (/^\/turnos\/\d+/.test(location.pathname))
    }
    return {
      color: activo ? '#183746' : '#d6e2e8',
      background: activo ? '#ffffff' : 'transparent',
      border: activo ? '1px solid rgba(255,255,255,0.72)' : '1px solid transparent',
      borderRadius: '6px',
      padding: '7px 10px',
      textDecoration: 'none',
      fontWeight: '800',
      fontSize: '14px',
      boxShadow: activo ? '0 2px 8px rgba(0,0,0,0.12)' : 'none'
    }
  }

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
            <Link to="/turnos" style={linkStyle('/turnos')}>Turnos</Link>

            {(usuario.rol === 'estudiante' || usuario.rol === 'admin') && (
              <Link to="/turnos/nuevo" style={linkStyle('/turnos/nuevo')}>Nuevo Turno</Link>
            )}

            {usuario.rol === 'admin' && (
              <>
                <Link to="/admin/usuarios" style={linkStyle('/admin/usuarios')}>Usuarios</Link>
                <Link to="/resumen" style={linkStyle('/resumen')}>Panel Administrativo</Link>
              </>
            )}

            <span style={{ color: '#aec4cf', fontSize: '14px' }}>
              <Link
                to="/perfil"
                style={{
                  color: location.pathname === '/perfil' ? '#183746' : '#aec4cf',
                  background: location.pathname === '/perfil' ? '#ffffff' : 'transparent',
                  border: location.pathname === '/perfil' ? '1px solid rgba(255,255,255,0.72)' : '1px solid transparent',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  textDecoration: 'none',
                  fontWeight: '800'
                }}
              >
                {usuario.nombre} ({usuario.rol})
              </Link>
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
            <Link to="/login" style={linkStyle('/login')}>Login</Link>
            <Link to="/register" style={linkStyle('/register')}>Registrarse</Link>
          </>
        )}
      </div>
    </nav>
  )
}
