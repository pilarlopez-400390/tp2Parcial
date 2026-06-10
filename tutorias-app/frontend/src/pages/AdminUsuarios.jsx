import { useState, useEffect } from 'react'
import usuariosService from '../services/usuariosService'

export default function AdminUsuarios() {
  const [vista, setVista] = useState('nuevo') // 'nuevo' | 'lista'
  const [usuarios, setUsuarios] = useState([])
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [loading, setLoading] = useState(false)
  const [tabRol, setTabRol] = useState('todos')
  const [busqueda, setBusqueda] = useState('')

  const [nuevo, setNuevo] = useState({
    nombre: '', email: '', password: '', rol: 'estudiante',
    especialidad: 'backend', diasDisponibles: []
  })

  const [modalEditar, setModalEditar] = useState(null)
  const [formEdicion, setFormEdicion] = useState({ nombre: '', email: '', activo: true })
  const [errorModal, setErrorModal] = useState('')

  useEffect(() => {
    if (vista === 'lista') cargarUsuarios()
  }, [vista])

  async function cargarUsuarios() {
    setLoading(true)
    setError('')
    try {
      const data = await usuariosService.listar()
      setUsuarios(data.filter(u => u.rol !== 'admin'))
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  async function handleCrear(e) {
    e.preventDefault()
    setError('')
    setExito('')
    try {
      await usuariosService.crear(nuevo)
      setNuevo({ nombre: '', email: '', password: '', rol: 'estudiante', especialidad: 'backend', diasDisponibles: [] })
      setExito('Usuario creado correctamente.')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear usuario')
    }
  }

  function abrirEditar(usuario) {
    setModalEditar(usuario)
    setFormEdicion({ nombre: usuario.nombre, email: usuario.email, activo: usuario.activo })
    setErrorModal('')
  }

  function cerrarEditar() {
    setModalEditar(null)
    setErrorModal('')
  }

  async function handleEditar(e) {
    e.preventDefault()
    setErrorModal('')
    try {
      await usuariosService.actualizar(modalEditar.id, formEdicion)
      cerrarEditar()
      cargarUsuarios()
    } catch (err) {
      setErrorModal(err.response?.data?.error || 'Error al actualizar usuario')
    }
  }

  async function handleEliminar(usuario) {
    if (!window.confirm(`¿Eliminar permanentemente a "${usuario.nombre}"? Esta acción no se puede deshacer.`)) return
    setError('')
    try {
      await usuariosService.eliminar(usuario.id)
      cargarUsuarios()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar usuario')
    }
  }

  const usuariosFiltrados = usuarios.filter(u => {
    if (tabRol !== 'todos' && u.rol !== tabRol) return false
    if (busqueda) {
      const q = busqueda.toLowerCase()
      return u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    }
    return true
  })

  const btnBase = { padding: '12px 24px', borderRadius: '6px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold', transition: 'all 0.15s' }

  return (
    <div style={{ maxWidth: '980px', margin: '24px auto', padding: '0 16px' }}>
      <h2 style={{ marginBottom: '24px' }}>👥 Gestión de Usuarios</h2>

      {/* Botones de navegación */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '28px' }}>
        <button
          onClick={() => { setVista('nuevo'); setError(''); setExito('') }}
          style={{
            ...btnBase,
            background: vista === 'nuevo' ? '#27ae60' : '#fff',
            color: vista === 'nuevo' ? 'white' : '#333',
            border: vista === 'nuevo' ? '2px solid #27ae60' : '2px solid #ddd'
          }}
        >
          Registrar Nuevo Usuario
        </button>
        <button
          onClick={() => { setVista('lista'); setError(''); setExito('') }}
          style={{
            ...btnBase,
            background: vista === 'lista' ? '#2980b9' : '#fff',
            color: vista === 'lista' ? 'white' : '#333',
            border: vista === 'lista' ? '2px solid #2980b9' : '2px solid #ddd'
          }}
        >
          Usuarios Existentes
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: '16px', color: '#c00', background: '#fee', padding: '12px', borderRadius: '6px', border: '1px solid #fcc' }}>
          ⚠️ {error}
        </div>
      )}
      {exito && (
        <div style={{ marginBottom: '16px', color: '#2e7d32', background: '#e8f5e9', padding: '12px', borderRadius: '6px', border: '1px solid #a5d6a7' }}>
          ✅ {exito}
        </div>
      )}

      {/* ── VISTA: REGISTRAR NUEVO USUARIO ── */}
      {vista === 'nuevo' && (
        <div style={{ maxWidth: '500px', padding: '28px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3 style={{ marginBottom: '20px' }}>Nuevo usuario</h3>
          <form onSubmit={handleCrear} style={{ display: 'grid', gap: '12px' }}>
            <input
              value={nuevo.nombre}
              onChange={e => setNuevo(prev => ({ ...prev, nombre: e.target.value }))}
              placeholder="Nombre"
              required
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <input
              type="email"
              value={nuevo.email}
              onChange={e => setNuevo(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Email"
              required
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <input
              type="password"
              value={nuevo.password}
              onChange={e => setNuevo(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Contraseña"
              required
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <select
              value={nuevo.rol}
              onChange={e => setNuevo(prev => ({ ...prev, rol: e.target.value }))}
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="estudiante">Estudiante</option>
              <option value="tutor">Tutor</option>
            </select>

            {nuevo.rol === 'tutor' && (
              <>
                <label style={{ fontWeight: 'bold', marginTop: '4px' }}>Especialidad</label>
                <select
                  value={nuevo.especialidad}
                  onChange={e => setNuevo(prev => ({ ...prev, especialidad: e.target.value }))}
                  required
                  style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="backend">Backend</option>
                  <option value="frontend">Frontend</option>
                  <option value="testing">Testing</option>
                  <option value="seguridad">Seguridad</option>
                </select>

                <label style={{ fontWeight: 'bold', marginTop: '4px' }}>Días disponibles</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['lunes', 'martes', 'miercoles', 'jueves', 'viernes'].map(d => (
                    <label key={d} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={nuevo.diasDisponibles.includes(d)}
                        onChange={e => {
                          if (e.target.checked) setNuevo(prev => ({ ...prev, diasDisponibles: [...prev.diasDisponibles, d] }))
                          else setNuevo(prev => ({ ...prev, diasDisponibles: prev.diasDisponibles.filter(x => x !== d) }))
                        }}
                      /> {d}
                    </label>
                  ))}
                </div>
              </>
            )}

            <button
              type="submit"
              style={{ padding: '12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginTop: '4px' }}
            >
              Crear usuario
            </button>
          </form>
        </div>
      )}

      {/* ── VISTA: USUARIOS EXISTENTES ── */}
      {vista === 'lista' && (
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #ddd', padding: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>Usuarios existentes</h3>

          {/* Tabs de rol */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {[['todos', 'Todos'], ['estudiante', 'Estudiantes'], ['tutor', 'Tutores']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setTabRol(val)}
                style={{
                  padding: '8px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', border: 'none',
                  background: tabRol === val ? '#2980b9' : '#f0f0f0',
                  color: tabRol === val ? 'white' : '#555'
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Buscador */}
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="🔍 Buscar por nombre o email..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', padding: '24px', color: '#888' }}>Cargando...</p>
          ) : usuariosFiltrados.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '24px', color: '#888' }}>No se encontraron usuarios.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ borderBottom: '2px solid #ddd', textAlign: 'left', padding: '10px' }}>Nombre</th>
                  <th style={{ borderBottom: '2px solid #ddd', textAlign: 'left', padding: '10px' }}>Email</th>
                  <th style={{ borderBottom: '2px solid #ddd', textAlign: 'left', padding: '10px' }}>Rol</th>
                  <th style={{ borderBottom: '2px solid #ddd', textAlign: 'left', padding: '10px' }}>Activo</th>
                  <th style={{ borderBottom: '2px solid #ddd', textAlign: 'left', padding: '10px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map(usuario => (
                  <tr key={usuario.id} style={{ background: usuario.activo ? 'white' : '#fff8f8' }}>
                    <td style={{ borderBottom: '1px solid #eee', padding: '10px' }}>{usuario.nombre}</td>
                    <td style={{ borderBottom: '1px solid #eee', padding: '10px' }}>{usuario.email}</td>
                    <td style={{ borderBottom: '1px solid #eee', padding: '10px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                        background: usuario.rol === 'tutor' ? '#e3f2fd' : '#e8f5e9',
                        color: usuario.rol === 'tutor' ? '#1565c0' : '#2e7d32'
                      }}>
                        {usuario.rol}
                      </span>
                    </td>
                    <td style={{ borderBottom: '1px solid #eee', padding: '10px' }}>
                      <span style={{ color: usuario.activo ? '#2e7d32' : '#c62828', fontWeight: 'bold' }}>
                        {usuario.activo ? 'Sí' : 'No'}
                      </span>
                    </td>
                    <td style={{ borderBottom: '1px solid #eee', padding: '10px' }}>
                      <button
                        onClick={() => abrirEditar(usuario)}
                        style={{ padding: '6px 12px', background: '#f39c12', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer', marginRight: '8px' }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleEliminar(usuario)}
                        style={{ padding: '6px 12px', background: '#e74c3c', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── MODAL EDICIÓN ── */}
      {modalEditar && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '28px', width: '420px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
            <h3 style={{ marginBottom: '20px' }}>✏️ Editar Usuario</h3>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '16px' }}>
              Rol: <strong>{modalEditar.rol}</strong>
            </p>

            {errorModal && (
              <div style={{ marginBottom: '12px', color: '#c00', background: '#fee', padding: '10px', borderRadius: '4px', border: '1px solid #fcc' }}>
                ⚠️ {errorModal}
              </div>
            )}

            <form onSubmit={handleEditar} style={{ display: 'grid', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Nombre</label>
                <input
                  value={formEdicion.nombre}
                  onChange={e => setFormEdicion(prev => ({ ...prev, nombre: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Email</label>
                <input
                  type="email"
                  value={formEdicion.email}
                  onChange={e => setFormEdicion(prev => ({ ...prev, email: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ fontWeight: 'bold' }}>Activo:</label>
                <select
                  value={String(formEdicion.activo)}
                  onChange={e => setFormEdicion(prev => ({ ...prev, activo: e.target.value === 'true' }))}
                  style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="true">Sí</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Guardar cambios
                </button>
                <button
                  type="button"
                  onClick={cerrarEditar}
                  style={{ flex: 1, padding: '12px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
