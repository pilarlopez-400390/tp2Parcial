// src/context/AuthContext.jsx
// Context de autenticación — guarda quién está logueado en toda la app.
//
// ¿Cómo funciona Context?
// 1. createContext() crea el "contenedor" de datos compartidos
// 2. <AuthContext.Provider value={...}> envuelve la app y da acceso a esos datos
// 3. useContext(AuthContext) en cualquier componente lee esos datos
//
// Es como una variable global pero de React — no hay que pasar props por 5 niveles.

import { createContext, useContext, useState, useEffect } from 'react'

// Creamos el contexto — empieza vacío (null)
const AuthContext = createContext(null)

// AuthProvider es el componente que envuelve toda la app
// Mantiene el estado del usuario logueado
export function AuthProvider({ children }) {
  // useState(null) → estado inicial = null (no hay usuario)
  // usuario tiene la forma: { id, nombre, email, rol }
  const [usuario, setUsuario] = useState(null)
  const [token, setToken] = useState(null)
  const [cargando, setCargando] = useState(true) // true mientras carga desde localStorage

  // useEffect con [] se ejecuta UNA sola vez al montar el componente
  // Aquí recuperamos la sesión guardada en localStorage
  useEffect(() => {
    const tokenGuardado = localStorage.getItem('token')
    const usuarioGuardado = localStorage.getItem('usuario')

    if (tokenGuardado && usuarioGuardado) {
      setToken(tokenGuardado)
      // JSON.parse convierte el string guardado en localStorage al objeto original
      setUsuario(JSON.parse(usuarioGuardado))
    }
    setCargando(false) // Ya terminamos de cargar
  }, [])

  // login() guarda el token y usuario en estado Y en localStorage
  // localStorage persiste entre recargas de página (a diferencia del state de React)
  function login(nuevoToken, nuevoUsuario) {
    setToken(nuevoToken)
    setUsuario(nuevoUsuario)
    localStorage.setItem('token', nuevoToken)
    // JSON.stringify convierte el objeto a string para guardarlo en localStorage
    localStorage.setItem('usuario', JSON.stringify(nuevoUsuario))
  }

  // logout() limpia todo
  function logout() {
    setToken(null)
    setUsuario(null)
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
  }

  // El valor que exponemos al resto de la app
  const valor = { usuario, token, login, logout, cargando }

  return (
    <AuthContext.Provider value={valor}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook personalizado — en lugar de escribir useContext(AuthContext) en cada componente,
// usamos este atajo: const { usuario, token } = useAuth()
export function useAuth() {
  return useContext(AuthContext)
}
