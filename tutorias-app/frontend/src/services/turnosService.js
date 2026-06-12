// src/services/turnosService.js
import api from './api'

// GET /api/turnos con filtros opcionales
// filtros puede tener: { fecha, estado, tutorId, especialidad, page, limit }
async function listar(filtros = {}) {
  // params: convierte el objeto en query string: ?fecha=2026-06-10&estado=confirmado
  const response = await api.get('/turnos', { params: filtros })
  return response.data // { data: [...], pagination: { page, limit, total, totalPages } }
}

// GET /api/turnos/resumen — solo admin
async function resumen() {
  const response = await api.get('/turnos/resumen')
  return response.data
}

// GET /api/turnos/:id
async function obtener(id) {
  const response = await api.get(`/turnos/${id}`)
  return response.data
}

// GET /api/turnos/:id/historial
async function historial(id) {
  const response = await api.get(`/turnos/${id}/historial`)
  return response.data
}

// POST /api/turnos
async function crear(datos) {
  const response = await api.post('/turnos', datos)
  return response.data
}

// PUT /api/turnos/:id
async function editar(id, datos) {
  const response = await api.put(`/turnos/${id}`, datos)
  return response.data
}

// PATCH /api/turnos/:id/cancelar
async function cancelar(id, observaciones) {
  const response = await api.patch(`/turnos/${id}/cancelar`, { observaciones })
  return response.data
}

// PATCH /api/turnos/:id/confirmar
async function confirmar(id) {
  const response = await api.patch(`/turnos/${id}/confirmar`)
  return response.data
}

// PATCH /api/turnos/:id/realizar
async function realizar(id, observaciones) {
  const response = await api.patch(`/turnos/${id}/realizar`, { observaciones })
  return response.data
}

export default { listar, resumen, obtener, historial, crear, editar, cancelar, confirmar, realizar }
