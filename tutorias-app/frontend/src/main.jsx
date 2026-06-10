// src/main.jsx
// Punto de entrada de la aplicación React.
// ReactDOM.createRoot monta el árbol de componentes en el div#root del HTML.

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// StrictMode activa advertencias adicionales de React en desarrollo.
// No afecta el comportamiento en producción.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
