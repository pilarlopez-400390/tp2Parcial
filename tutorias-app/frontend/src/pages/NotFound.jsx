// src/pages/NotFound.jsx
// Pagina 404.

import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '96px 24px' }}>
      <p style={{ margin: 0, color: '#667085', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Error 404</p>
      <h1 style={{ fontSize: '46px', margin: '12px 0 10px', color: '#182230' }}>Pagina no encontrada</h1>
      <p style={{ fontSize: '18px', color: '#667085', marginBottom: '32px' }}>
        La direccion ingresada no coincide con ninguna ruta disponible.
      </p>
      <Link
        to="/"
        style={{ background: '#245b73', color: 'white', padding: '12px 22px', borderRadius: '6px', textDecoration: 'none', fontSize: '15px', fontWeight: '800', display: 'inline-block' }}
      >
        Volver al inicio
      </Link>
    </div>
  )
}
