const bcrypt = require('bcryptjs')
const db = require('../config/database')

const ROLES_VALIDOS = ['estudiante', 'tutor', 'admin']

function parseDiasDisponibles(value) {
  if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean)
  if (!value) return []
  return String(value)
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter(Boolean)
}

function validarEmailUnico(email) {
  const usuarios = db.findAll('usuarios')
  for (let i = 0; i < usuarios.length; i++) {
    if (usuarios[i].email === email) {
      const err = new Error('El email ya está registrado')
      err.status = 400
      throw err
    }
  }
}

function sanitizarUsuario(usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    activo: usuario.activo
  }
}

function listarUsuarios({ rol, activo } = {}, usuarioActual) {
  const usuarios = db.findAll('usuarios')

  if (usuarioActual.rol === 'tutor') {
    if (rol && rol !== 'estudiante') {
      const err = new Error('Los tutores solo pueden consultar estudiantes')
      err.status = 403
      throw err
    }
    return usuarios
      .filter(u => u.rol === 'estudiante')
      .filter(u => activo === undefined || u.activo === (activo === 'true'))
      .map(sanitizarUsuario)
  }

  let resultado = usuarios
  if (rol) {
    resultado = resultado.filter(u => u.rol === rol)
  }
  if (activo !== undefined) {
    resultado = resultado.filter(u => u.activo === (activo === 'true'))
  }

  return resultado.map(sanitizarUsuario)
}

function obtenerUsuarioPorId(id) {
  const usuario = db.findById('usuarios', id)
  if (!usuario) {
    const err = new Error('Usuario no encontrado')
    err.status = 404
    throw err
  }
  return sanitizarUsuario(usuario)
}

function crearUsuario({ nombre, email, password, rol, especialidad, diasDisponibles }) {
  if (!nombre || !email || !password || !rol) {
    const err = new Error('Nombre, email, contraseña y rol son obligatorios')
    err.status = 400
    throw err
  }

  if (!ROLES_VALIDOS.includes(rol) || rol === 'admin') {
    const err = new Error('Rol inválido. Solo se pueden crear estudiantes o tutores')
    err.status = 400
    throw err
  }

  validarEmailUnico(email)

  const passwordHash = bcrypt.hashSync(password, 10)

  const usuario = db.insert('usuarios', {
    nombre,
    email,
    passwordHash,
    rol,
    activo: true
  })

  if (rol === 'tutor') {
    const dias = parseDiasDisponibles(diasDisponibles)
    if (!especialidad || dias.length === 0) {
      const err = new Error('Los tutores requieren especialidad y días disponibles')
      err.status = 400
      throw err
    }

    db.insert('tutores', {
      usuarioId: usuario.id,
      nombre,
      email,
      especialidad,
      diasDisponibles: dias,
      activo: true
    })
  }

  return sanitizarUsuario(usuario)
}

function eliminarUsuario(id) {
  const usuario = db.findById('usuarios', id)
  if (!usuario) {
    const err = new Error('Usuario no encontrado')
    err.status = 404
    throw err
  }
  if (usuario.rol === 'admin') {
    const err = new Error('No se puede eliminar a un administrador')
    err.status = 400
    throw err
  }
  if (usuario.rol === 'tutor') {
    const tutores = db.findAll('tutores')
    for (let i = 0; i < tutores.length; i++) {
      if (tutores[i].usuarioId === id) {
        db.remove('tutores', tutores[i].id)
        break
      }
    }
  }
  db.remove('usuarios', id)
}

function actualizarUsuario(id, updates) {
  const usuario = db.findById('usuarios', id)
  if (!usuario) {
    const err = new Error('Usuario no encontrado')
    err.status = 404
    throw err
  }

  const cambios = {}
  if (updates.nombre) cambios.nombre = updates.nombre
  if (updates.email && updates.email !== usuario.email) {
    validarEmailUnico(updates.email)
    cambios.email = updates.email
  }
  if (updates.activo !== undefined) {
    cambios.activo = updates.activo === true || updates.activo === 'true'
  }

  const usuarioActualizado = db.update('usuarios', id, cambios)

  if (usuario.rol === 'tutor' && cambios.activo !== undefined) {
    const tutores = db.findAll('tutores')
    for (let i = 0; i < tutores.length; i++) {
      if (tutores[i].usuarioId === id) {
        db.update('tutores', tutores[i].id, { activo: usuarioActualizado.activo })
        break
      }
    }
  }

  if (usuario.rol === 'tutor' && cambios.nombre) {
    const tutores = db.findAll('tutores')
    for (let i = 0; i < tutores.length; i++) {
      if (tutores[i].usuarioId === id) {
        db.update('tutores', tutores[i].id, { nombre: cambios.nombre })
        break
      }
    }
  }

  if (usuario.rol === 'tutor' && cambios.email) {
    const tutores = db.findAll('tutores')
    for (let i = 0; i < tutores.length; i++) {
      if (tutores[i].usuarioId === id) {
        db.update('tutores', tutores[i].id, { email: cambios.email })
        break
      }
    }
  }

  return sanitizarUsuario(usuarioActualizado)
}

module.exports = {
  listarUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario
}
