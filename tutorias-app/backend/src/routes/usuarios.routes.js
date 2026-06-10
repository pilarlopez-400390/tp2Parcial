const express = require('express')
const router = express.Router()
const usuariosController = require('../controllers/usuarios.controller')
const verificarToken = require('../middlewares/auth.middleware')
const autorizar = require('../middlewares/authorize.middleware')

router.get('/', verificarToken, autorizar('admin', 'tutor'), usuariosController.listar)
router.post('/', verificarToken, autorizar('admin'), usuariosController.crear)
router.patch('/:id', verificarToken, autorizar('admin'), usuariosController.actualizar)
router.delete('/:id', verificarToken, autorizar('admin'), usuariosController.eliminar)

module.exports = router
