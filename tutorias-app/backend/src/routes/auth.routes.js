// auth.routes.js
// Define las rutas del módulo de autenticación

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// express.Router() crea un mini-app de Express solo para estas rutas.
// Después en app.js la montamos en '/api/auth', entonces:
//   router.post('/register') → POST /api/auth/register
//   router.post('/login')    → POST /api/auth/login

// Estas dos rutas NO necesitan JWT — son públicas
// (no tienen middleware verificarToken)
router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;
