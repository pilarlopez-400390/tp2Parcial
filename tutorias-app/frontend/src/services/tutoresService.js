// src/services/tutoresService.js
import api from './api'

// GET /api/tutores — lista todos los tutores activos
async function listar() {
  const response = await api.get('/tutores')
  return response.data
}

// GET /api/tutores/:id — detalle de un tutor
async function obtener(id) {
  const response = await api.get(`/tutores/${id}`)
  return response.data
}

export default { listar, obtener }
