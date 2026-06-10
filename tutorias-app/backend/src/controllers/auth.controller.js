// auth.controller.js
// El controller recibe la petición HTTP, llama al service y devuelve JSON al cliente.
// NUNCA pone lógica de negocio aquí — eso va en el service.

const authService = require('../services/auth.service');

// POST /api/auth/register
// Registra un nuevo usuario
async function register(req, res, next) {
  try {
    // req.body contiene lo que mandó el cliente en el JSON del POST
    const { nombre, email, password } = req.body;

    // Llamamos al service que tiene la lógica real (validar, hashear, guardar)
    const usuario = await authService.registrar({ nombre, email, password });

    // 201 = Created (éxito al crear un recurso nuevo)
    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      usuario  // el service ya quitó el passwordHash antes de retornar
    });
  } catch (err) {
    // next(err) pasa el error al errorHandler middleware
    // Ese middleware lo convierte en JSON { error: "mensaje" }
    next(err);
  }
}

// POST /api/auth/login
// Verifica credenciales y devuelve JWT
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // El service verifica el email, compara la contraseña y genera el token
    const resultado = await authService.login({ email, password });

    // 200 = OK (operación exitosa)
    res.status(200).json(resultado);
    // resultado tiene la forma: { token, usuario: { id, nombre, email, rol } }
  } catch (err) {
    next(err);
  }
}

// Exportamos las funciones para que las rutas puedan usarlas
module.exports = { register, login };
