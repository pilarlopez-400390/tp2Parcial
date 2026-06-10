// src/pages/Login.jsx
// Formulario de login

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import authService from '../services/authService'

export default function Login() {
  // useState para cada campo del formulario
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')       // Mensaje de error de la API
  const [cargando, setCargando] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  // handleSubmit se ejecuta cuando el usuario envía el formulario
  async function handleSubmit(e) {
    // e.preventDefault() evita que la página se recargue (comportamiento por defecto de los forms HTML)
    e.preventDefault()
    setError('')
    setCargando(true)

    try {
      // Llamamos al servicio — si las credenciales son incorrectas, lanza error
      const data = await authService.login(email, password)
      // data tiene: { token, usuario: { id, nombre, email, rol } }

      // Guardamos en el AuthContext (que también guarda en localStorage)
      login(data.token, data.usuario)

      // Redirigimos según el rol
      if (data.usuario.rol === 'admin') {
        navigate('/resumen')
      } else {
        navigate('/turnos')
      }
    } catch (err) {
      // err.response.data.error tiene el mensaje de error del backend
      setError(err.response?.data?.error || 'Error al iniciar sesión')
    } finally {
      // finally se ejecuta SIEMPRE (éxito o error)
      setCargando(false)
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '24px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>🔐 Iniciar Sesión</h2>

      {/* Mostramos el error si hay uno */}
      {error && (
        <div style={{ background: '#fee', border: '1px solid #fcc', padding: '12px', borderRadius: '4px', marginBottom: '16px', color: '#c00' }}>
          ⚠️ {error}
        </div>
      )}

      {/* onSubmit={handleSubmit} conecta el envío del form con nuestra función */}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>Email</label>
          <input
            type="email"
            value={email}
            // onChange actualiza el estado cada vez que el usuario escribe
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
            placeholder="admin@dds.com"
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
          />
        </div>

        <button
          type="submit"
          disabled={cargando}
          style={{ width: '100%', padding: '12px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}
        >
          {cargando ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '16px' }}>
        ¿No tenés cuenta? <Link to="/register">Registrarse</Link>
      </p>
    </div>
  )
}
