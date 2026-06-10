// auth.service.js - Lógica de negocio para autenticación
//
// Los servicios contienen la lógica de negocio "pura".
// No saben nada de HTTP (req/res), solo reciben datos y devuelven resultados.
// Si algo falla, lanzan un Error con un campo .status.

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/database');

// ── REGISTRAR ────────────────────────────────────────────────────────────────

function registrar({ nombre, email, password }) {

  // 1. Validar que los campos obligatorios llegaron
  if (!nombre || !email || !password) {
    const err = new Error('Nombre, email y contraseña son obligatorios');
    err.status = 400;
    throw err;
  }

  // 2. El registro público solo puede crear estudiantes
  const rol = 'estudiante';

  // 3. Verificar que el email no esté en uso
  const todos = db.findAll('usuarios');
  for (let i = 0; i < todos.length; i++) {
    if (todos[i].email === email) {
      const err = new Error('El email ya está registrado');
      err.status = 400;
      throw err;
    }
  }

  // 4. Hashear la contraseña
  //    bcrypt.hashSync(password, 10): el 10 es el "cost factor"
  //    Más alto = más lento pero más seguro. 10 es el estándar recomendado.
  //    NUNCA guardamos la contraseña en texto plano.
  const passwordHash = bcrypt.hashSync(password, 10);

  // 5. Insertar usuario en la base de datos
  const nuevoUsuario = db.insert('usuarios', {
    nombre, email, passwordHash, rol, activo: true
  });

  // Devolvemos el usuario SIN el hash de contraseña
  return {
    id:     nuevoUsuario.id,
    nombre: nuevoUsuario.nombre,
    email:  nuevoUsuario.email,
    rol:    nuevoUsuario.rol
  };
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────

function login({ email, password }) {

  // 1. Buscar el usuario por email
  const usuarios = db.findAll('usuarios');
  let usuario = null;
  for (let i = 0; i < usuarios.length; i++) {
    if (usuarios[i].email === email) {
      usuario = usuarios[i];
      break;
    }
  }

  // Usamos el mismo mensaje para email y contraseña incorrectos.
  // Así no le damos información al atacante sobre si el email existe.
  if (!usuario) {
    const err = new Error('Email o contraseña incorrectos');
    err.status = 401;
    throw err;
  }

  // 2. Verificar que el usuario esté activo
  if (!usuario.activo) {
    const err = new Error('Usuario inactivo. Contactá al administrador.');
    err.status = 401;
    throw err;
  }

  // 3. Comparar contraseña con el hash guardado
  //    bcrypt.compareSync toma la contraseña en texto plano y el hash,
  //    y devuelve true si coinciden.
  const passwordValida = bcrypt.compareSync(password, usuario.passwordHash);
  if (!passwordValida) {
    const err = new Error('Email o contraseña incorrectos');
    err.status = 401;
    throw err;
  }

  // 4. Crear el JWT
  //    El payload es lo que se codifica dentro del token.
  //    IMPORTANTE: NO incluir contraseña ni datos sensibles.
  const payload = {
    id:     usuario.id,
    nombre: usuario.nombre,
    email:  usuario.email,
    rol:    usuario.rol
  };

  // jwt.sign(payload, secret, options)
  //   - payload: los datos que queremos codificar
  //   - secret:  clave secreta para firmar (guardada en .env)
  //   - expiresIn: cuánto dura el token
  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  return { token, usuario: payload };
}

module.exports = { registrar, login };
