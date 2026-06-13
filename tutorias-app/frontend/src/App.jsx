// src/App.jsx
// Componente raíz de la aplicación.
// Configura React Router (sistema de navegación entre páginas) y el AuthContext.
//
// ¿Cómo funciona React Router?
// BrowserRouter: habilita la navegación con URLs reales (no #/hash)
// Routes:        contenedor de todas las rutas
// Route:         mapea una URL a un componente
//   path="/"     → URL raíz (http://localhost:5173/)
//   path="/login"→ http://localhost:5173/login
//   path="*"     → cualquier URL que no matcheó nada → página 404

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Navbar from './components/Navbar'

// Páginas
import Login from './pages/Login'
import Register from './pages/Register'
import TurnosList from './pages/TurnosList'
import TurnoDetalle from './pages/TurnoDetalle'
import TurnoForm from './pages/TurnoForm'
import ResumenAdmin from './pages/ResumenAdmin'
import AdminUsuarios from './pages/AdminUsuarios'
import Perfil from './pages/Perfil'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    // AuthProvider envuelve TODO para que cualquier componente pueda usar useAuth()
    <AuthProvider>
      {/* BrowserRouter habilita el routing basado en URL del navegador */}
      <BrowserRouter>
        {/* Navbar siempre visible en todas las páginas */}
        <Navbar />

        {/* Routes: solo renderiza el primer Route que coincide con la URL actual */}
        <Routes>

          {/* Ruta raíz → redirige a /turnos si está logueado, a /login si no */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Rutas públicas (no necesitan login) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Rutas protegidas — cualquier usuario logueado */}
          <Route
            path="/turnos"
            element={
              <PrivateRoute>
                <TurnosList />
              </PrivateRoute>
            }
          />

          {/* Ruta para crear un nuevo turno — estudiantes y admins */}
          <Route
            path="/turnos/nuevo"
            element={
              <PrivateRoute roles={['estudiante', 'admin']}>
                <TurnoForm />
              </PrivateRoute>
            }
          />

          {/* Detalle de un turno — cualquier usuario logueado */}
          <Route
            path="/turnos/:id"
            element={
              <PrivateRoute>
                <TurnoDetalle />
              </PrivateRoute>
            }
          />

          {/* Editar un turno — solo admin */}
          <Route
            path="/turnos/:id/editar"
            element={
              <PrivateRoute roles={['admin']}>
                <TurnoForm />
              </PrivateRoute>
            }
          />

          {/* Panel de admin — solo admin */}
          <Route
            path="/resumen"
            element={
              <PrivateRoute roles={['admin']}>
                <ResumenAdmin />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/usuarios"
            element={
              <PrivateRoute roles={['admin']}>
                <AdminUsuarios />
              </PrivateRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <PrivateRoute>
                <Perfil />
              </PrivateRoute>
            }
          />

          {/* Wildcard: cualquier URL que no matcheó nada → 404 */}
          {/* DEBE IR AL FINAL porque React Router para en el primer match */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
