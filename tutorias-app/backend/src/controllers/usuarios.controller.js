const usuariosService = require('../services/usuarios.service')

async function listar(req, res, next) {
  try {
    const filtros = req.query
    const usuarios = await usuariosService.listarUsuarios(filtros, req.user)
    res.status(200).json(usuarios)
  } catch (err) {
    next(err)
  }
}

async function crear(req, res, next) {
  try {
    const usuario = await usuariosService.crearUsuario(req.body)
    res.status(201).json(usuario)
  } catch (err) {
    next(err)
  }
}

async function actualizar(req, res, next) {
  try {
    const id = parseInt(req.params.id)
    const usuario = await usuariosService.actualizarUsuario(id, req.body)
    res.status(200).json(usuario)
  } catch (err) {
    next(err)
  }
}

async function eliminar(req, res, next) {
  try {
    const id = parseInt(req.params.id)
    await usuariosService.eliminarUsuario(id)
    res.status(200).json({ mensaje: 'Usuario eliminado correctamente' })
  } catch (err) {
    next(err)
  }
}

module.exports = { listar, crear, actualizar, eliminar }
