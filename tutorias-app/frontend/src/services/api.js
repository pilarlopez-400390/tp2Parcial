// src/services/api.js
// Instancia base de Axios con configuración compartida.
// Todos los servicios la usan — así no repetimos baseURL y headers en cada llamada.

import axios from 'axios'

// axios.create() crea una instancia personalizada con configuración base
const api = axios.create({
  baseURL: '/api',        // Vite proxy: /api → http://localhost:3001/api
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor de REQUEST
// Se ejecuta ANTES de cada petición que hagamos con api.get/post/etc.
// Agrega automáticamente el token JWT al header Authorization.
//
// ¿Por qué hacerlo acá y no en cada servicio?
// Si no, tendríamos que escribir el header en cada llamada individualmente.
api.interceptors.request.use(
  (config) => {
    // Leemos el token de localStorage (donde lo guardó AuthContext.login)
    const token = localStorage.getItem('token')
    if (token) {
      // Bearer <token> es el formato estándar para JWT
      config.headers.Authorization = `Bearer ${token}`
    }
    return config  // Devolvemos la config modificada
  },
  (error) => Promise.reject(error)
)

// Interceptor de RESPONSE
// Se ejecuta cuando llega la respuesta (o el error).
// Si el servidor devuelve 401, limpiamos la sesión y redirigimos al login.
api.interceptors.response.use(
  (response) => response,  // Si todo está bien, devolvemos la respuesta sin cambios
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expirado o inválido — limpiamos la sesión
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      // Redirigimos al login (recarga completa para resetear el estado de React)
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
