// src/services/authService.js
// Servicio para register y login. Usa la instancia api de Axios.

import api from './api'

// login: POST /api/auth/login
// Devuelve { token, usuario } si las credenciales son correctas
async function login(email, password) {
  // api.post(url, body) hace POST con JSON en el body
  const response = await api.post('/auth/login', { email, password })
  // response.data tiene el JSON de la respuesta del servidor
  return response.data
}

// register: POST /api/auth/register
async function register(nombre, email, password) {
  const response = await api.post('/auth/register', { nombre, email, password })
  return response.data
}

export default { login, register }
