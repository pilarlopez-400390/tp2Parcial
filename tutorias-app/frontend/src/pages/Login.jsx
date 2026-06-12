// src/pages/Login.jsx
// Formulario de login.

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import authService from '../services/authService'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setCargando(true)

    try {
      const data = await authService.login(email, password)
      login(data.token, data.usuario)

      if (data.usuario.rol === 'admin') {
        navigate('/resumen')
      } else {
        navigate('/turnos')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesion')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={{ maxWidth: '420px', margin: '88px auto', padding: '32px', border: '1px solid #d9e2ec', borderRadius: '8px', background: '#fff', boxShadow: '0 12px 28px rgba(16, 24, 40, 0.08)' }}>
      <h2 style={{ textAlign: 'center', margin: '0 0 26px', color: '#182230', fontSize: '26px', fontWeight: '800' }}>Iniciar sesion</h2>

      {error && (
        <div style={{ background: '#f9eaea', border: '1px solid #efc7c7', padding: '12px 14px', borderRadius: '6px', marginBottom: '18px', color: '#9f3a3a', fontWeight: '600' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', color: '#344054' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '11px 12px', border: '1px solid #d9e2ec', borderRadius: '6px', boxSizing: 'border-box' }}
            placeholder="ejemplo@correo.com"
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', color: '#344054' }}>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '11px 12px', border: '1px solid #d9e2ec', borderRadius: '6px', boxSizing: 'border-box' }}
            placeholder="********"
          />
        </div>

        <button
          type="submit"
          disabled={cargando}
          style={{ width: '100%', padding: '12px', background: '#245b73', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: '800' }}
        >
          {cargando ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '18px', color: '#667085' }}>
        ¿No tenes cuenta? <Link to="/register">Registrarse</Link>
      </p>
    </div>
  )
}
