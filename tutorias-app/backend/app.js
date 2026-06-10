// app.js
// Configura la aplicación Express: middlewares globales y rutas.
// NO arranca el servidor — eso lo hace server.js.
// Separarlo así permite que los tests importen app sin levantar un puerto real.

const express = require('express');
const cors = require('cors');

const app = express();

// --- MIDDLEWARES GLOBALES ---

// cors() permite que el frontend (corriendo en otro puerto) pueda hacer peticiones al backend.
// Sin esto, el navegador bloquea las peticiones por la "Same-Origin Policy".
// origin: 'http://localhost:5173' es el puerto por defecto de Vite (React).
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// express.json() parsea el body de las peticiones con Content-Type: application/json.
// Sin esto, req.body sería undefined cuando mandás { "email": "..." }.
app.use(express.json());

// --- RUTAS ---
// Importamos los routers y los "montamos" en su prefijo.
// app.use('/api/auth', authRouter) significa que todas las rutas del router
// quedan bajo /api/auth/... (ej: POST /api/auth/login)

const authRoutes = require('./src/routes/auth.routes');
const tutoresRoutes = require('./src/routes/tutores.routes');
const turnosRoutes = require('./src/routes/turnos.routes');
const usuariosRoutes = require('./src/routes/usuarios.routes');

app.use('/api/auth', authRoutes);
app.use('/api/tutores', tutoresRoutes);
app.use('/api/turnos', turnosRoutes);
app.use('/api/usuarios', usuariosRoutes);

// Ruta de health check — útil para saber si el servidor está vivo
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// --- ERROR HANDLER (DEBE IR AL FINAL, DESPUÉS DE LAS RUTAS) ---
// La firma especial (err, req, res, next) hace que Express lo reconozca
// automáticamente como manejador de errores.
// Cualquier next(err) de los controllers llegará aquí.
const errorHandler = require('./src/middlewares/errorHandler.middleware');
app.use(errorHandler);

module.exports = app;
