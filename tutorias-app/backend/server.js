// server.js
// Punto de entrada del backend. Solo arranca el servidor HTTP.
// Separa la configuración (app.js) del arranque (server.js).

// dotenv.config() carga el archivo .env y pone las variables en process.env.
// DEBE ir antes de cualquier otro require que use variables de entorno.
require('dotenv').config();

const app = require('./app');

// process.env.PORT viene del .env (PORT=3001)
// El || 3001 es un fallback por si no está definido
const PORT = process.env.PORT || 3001;

// app.listen(puerto, callback) arranca el servidor HTTP en ese puerto.
// El callback se ejecuta una sola vez cuando el servidor está listo.
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
});
