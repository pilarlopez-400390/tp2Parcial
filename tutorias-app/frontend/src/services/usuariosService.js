import api from './api'

// GET /api/usuarios?rol=estudiante&activo=true
async function listar(filtros = {}) {
  const response = await api.get('/usuarios', { params: filtros })
  return response.data
}

async function perfil() {
  const response = await api.get('/usuarios/me')
  return response.data
}

async function actualizarPerfil(datos) {
  const response = await api.patch('/usuarios/me', datos)
  return response.data
}

// POST /api/usuarios
async function crear(datos) {
  const response = await api.post('/usuarios', datos)
  return response.data
}

// PATCH /api/usuarios/:id
async function actualizar(id, datos) {
  const response = await api.patch(`/usuarios/${id}`, datos)
  return response.data
}

// DELETE /api/usuarios/:id
async function eliminar(id) {
  const response = await api.delete(`/usuarios/${id}`)
  return response.data
}

export default { listar, perfil, crear, actualizar, actualizarPerfil, eliminar }
