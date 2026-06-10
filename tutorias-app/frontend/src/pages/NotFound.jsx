// src/pages/NotFound.jsx
// Página 404 — se muestra cuando la URL no coincide con ninguna ruta

import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <div style={{ fontSize: '80px' }}>🔍</div>
      <h1 style={{ fontSize: '48px', margin: '16px 0' }}>404</h1>
      <p style={{ fontSize: '20px', color: '#666', marginBottom: '32px' }}>
        Esta página no existe.
      </p>
      <Link
        to="/"
        style={{ background: '#3498db', color: 'white', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', fontSize: '16px' }}
      >
        Volver al inicio
      </Link>
    </div>
  )
}
