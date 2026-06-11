// auth.routes.js
// Define las rutas del módulo de autenticación

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validarBody } = require('../middlewares/validate.middleware');

// express.Router() crea un mini-app de Express solo para estas rutas.
// Después en app.js la montamos en '/api/auth', entonces:
//   router.post('/register') → POST /api/auth/register
//   router.post('/login')    → POST /api/auth/login

// Estas dos rutas NO necesitan JWT — son públicas
// (no tienen middleware verificarToken)
router.post('/register', validarBody({
  requeridos: ['nombre', 'email', 'password'],
  permitidos: ['nombre', 'email', 'password']
}), authController.register);

router.post('/login', validarBody({
  requeridos: ['email', 'password'],
  permitidos: ['email', 'password']
}), authController.login);

module.exports = router;
