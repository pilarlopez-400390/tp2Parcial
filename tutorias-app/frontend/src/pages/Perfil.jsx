import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import usuariosService from '../services/usuariosService'

function separarNombre(nombreCompleto = '', apellidoGuardado = '') {
  const partes = nombreCompleto.trim().split(/\s+/).filter(Boolean)
  if (apellidoGuardado) {
    const apellidoPartes = apellidoGuardado.trim().split(/\s+/).length
    return {
      nombre: partes.slice(0, Math.max(1, partes.length - apellidoPartes)).join(' '),
      apellido: apellidoGuardado
    }
  }
  return {
    nombre: partes.slice(0, 1).join(' '),
    apellido: partes.slice(1).join(' ')
  }
}

export default function Perfil() {
  const navigate = useNavigate()
  const { usuario, login, token } = useAuth()

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    genero: '',
    telefono: '',
    password: ''
  })
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  useEffect(() => {
    cargarPerfil()
  }, [])

  async function cargarPerfil() {
    setCargando(true)
    setError('')
    try {
      const data = await usuariosService.perfil()
      const nombreSeparado = separarNombre(data.nombre, data.apellido)
      setForm({
        nombre: nombreSeparado.nombre,
        apellido: nombreSeparado.apellido,
        email: data.email || '',
        genero: data.genero || '',
        telefono: data.telefono || '',
        password: ''
      })
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar el perfil')
    } finally {
      setCargando(false)
    }
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setExito('')

    if (!form.nombre.trim() || !form.apellido.trim()) {
      setError('Nombre y apellido son obligatorios')
      return
    }

    setGuardando(true)
    try {
      const payload = {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        email: form.email.trim(),
        genero: form.genero,
        telefono: form.telefono.trim()
      }
      if (form.password.trim()) payload.password = form.password

      const actualizado = await usuariosService.actualizarPerfil(payload)
      login(token, { ...usuario, ...actualizado })
      setForm(prev => ({ ...prev, password: '' }))
      setExito('Perfil actualizado correctamente.')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar el perfil')
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) return <div style={{ textAlign: 'center', padding: '60px' }}>Cargando Perfil...</div>

  return (
    <div style={{ maxWidth: '620px', margin: '28px auto', padding: '0 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', gap: '12px' }}>
        <h2 style={{ margin: 0, color: '#182230', fontSize: '28px' }}>Editar Perfil</h2>
        <button onClick={() => navigate(-1)} style={{ background: '#fff', border: '1px solid #d9e2ec', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', color: '#344054' }}>
          Volver
        </button>
      </div>

      {error && <div style={{ marginBottom: '14px', color: '#9f3a3a', background: '#f9eaea', padding: '12px 14px', borderRadius: '6px', border: '1px solid #efc7c7', fontWeight: '600' }}>{error}</div>}
      {exito && <div style={{ marginBottom: '14px', color: '#2f6f58', background: '#e9f5ef', padding: '12px 14px', borderRadius: '6px', border: '1px solid #b8ddcd', fontWeight: '600' }}>{exito}</div>}

      <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1px solid #d9e2ec', borderRadius: '8px', padding: '24px', boxShadow: '0 12px 28px rgba(16, 24, 40, 0.06)', display: 'grid', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '800' }}>Nombre</label>
            <input name="nombre" value={form.nombre} onChange={handleChange} required style={{ width: '100%', padding: '10px', border: '1px solid #cfd8e3', borderRadius: '4px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '800' }}>Apellido</label>
            <input name="apellido" value={form.apellido} onChange={handleChange} required style={{ width: '100%', padding: '10px', border: '1px solid #cfd8e3', borderRadius: '4px', boxSizing: 'border-box' }} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '800' }}>Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required style={{ width: '100%', padding: '10px', border: '1px solid #cfd8e3', borderRadius: '4px', boxSizing: 'border-box' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '800' }}>Género</label>
            <select name="genero" value={form.genero} onChange={handleChange} style={{ width: '100%', padding: '10px', border: '1px solid #cfd8e3', borderRadius: '4px', boxSizing: 'border-box' }}>
              <option value="">Prefiero No Indicar</option>
              <option value="femenino">Femenino</option>
              <option value="masculino">Masculino</option>
              <option value="no-binario">No Binario</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '800' }}>Teléfono</label>
            <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Ej: 351 555 1234" style={{ width: '100%', padding: '10px', border: '1px solid #cfd8e3', borderRadius: '4px', boxSizing: 'border-box' }} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '800' }}>Contraseña Nueva</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Dejar vacío para mantener la actual" autoComplete="new-password" style={{ width: '100%', padding: '10px', border: '1px solid #cfd8e3', borderRadius: '4px', boxSizing: 'border-box' }} />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '800' }}>Rol</label>
          <div style={{ padding: '10px', border: '1px solid #d9e2ec', borderRadius: '4px', background: '#f8fafc', color: '#667085', fontWeight: '800' }}>
            {usuario?.rol || 'Sin Rol'}
          </div>
        </div>

        <button type="submit" disabled={guardando} style={{ marginTop: '6px', padding: '12px', background: '#245b73', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '800', fontSize: '15px' }}>
          {guardando ? 'Guardando...' : 'Guardar Perfil'}
        </button>
      </form>
    </div>
  )
}
