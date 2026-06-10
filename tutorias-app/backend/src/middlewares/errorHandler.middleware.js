// errorHandler.middleware.js - Manejador CENTRALIZADO de errores
//
// La CLAVE es la firma con 4 parámetros: (err, req, res, next)
// Express reconoce que es un error handler por tener exactamente 4 parámetros.
// Debe registrarse DESPUÉS de todas las rutas en app.js.
//
// Cómo funciona:
//   Cuando en cualquier parte del código hacemos next(error), Express
//   saltea todos los middlewares normales y va directo a este handler.
//
// Para usarlo, en un controller/service hacemos:
//   const err = new Error('Mensaje de error');
//   err.status = 400;
//   throw err;       // o next(err) en un controller

function errorHandler(err, req, res, next) {    // eslint-disable-line no-unused-vars
  // Si el error tiene un status definido lo usamos, sino 500 (error interno)
  const status  = err.status  || 500;
  const mensaje = err.message || 'Error interno del servidor';

  // En desarrollo mostramos el stack trace para facilitar el debugging
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[ERROR ${status}]`, err.message);
  }

  // Siempre respondemos con JSON para que el frontend lo pueda parsear
  res.status(status).json({ error: mensaje });
}

module.exports = errorHandler;
