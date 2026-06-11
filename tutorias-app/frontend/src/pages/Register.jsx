// src/pages/Register.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import authService from '../services/authService'

export default function Register() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const nombreNormalizado = nombre.trim().replace(/\s+/g, ' ')
    if (nombreNormalizado.split(' ').length < 2) {
      setError('Ingresa nombre y apellido para ordenar correctamente por apellido.')
      return
    }

    setCargando(true)

    try {
      await authService.register(nombreNormalizado, email, password)

      const data = await authService.login(email, password)
      login(data.token, data.usuario)
      navigate('/turnos')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={{ maxWidth: '430px', margin: '60px auto', padding: '28px', border: '1px solid #d9e0e7', borderRadius: '8px', background: '#fff', boxShadow: '0 14px 35px rgba(15, 23, 42, 0.08)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '24px', color: '#1f2937' }}>Registrarse</h2>

      {error && (
        <div style={{ background: '#fee', border: '1px solid #fcc', padding: '12px', borderRadius: '4px', marginBottom: '16px', color: '#c00' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Nombre y apellido</label>
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            required
            placeholder="Ej: Valentina Perez"
            style={{ width: '100%', padding: '10px', border: '1px solid #cfd8e3', borderRadius: '4px', boxSizing: 'border-box' }}
          />
          <small style={{ display: 'block', color: '#667085', marginTop: '5px' }}>Debe incluir al menos un nombre y un apellido.</small>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', border: '1px solid #cfd8e3', borderRadius: '4px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Contrasena</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            style={{ width: '100%', padding: '10px', border: '1px solid #cfd8e3', borderRadius: '4px', boxSizing: 'border-box' }}
          />
        </div>

        <button
          type="submit"
          disabled={cargando}
          style={{ width: '100%', padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: '700' }}
        >
          {cargando ? 'Registrando...' : 'Registrarse'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '16px' }}>
        Ya tenes cuenta? <Link to="/login">Iniciar sesion</Link>
      </p>
    </div>
  )
}
