// tutores.routes.js
// Rutas del módulo de tutores — todas son públicas

const express = require('express');
const router = express.Router();
const tutoresController = require('../controllers/tutores.controller');
const verificarToken = require('../middlewares/auth.middleware');

// GET /api/tutores → lista todos los tutores activos
router.get('/', verificarToken, tutoresController.listar);

// GET /api/tutores/:id → detalle de un tutor
// ':id' es un parámetro dinámico — Express lo pone en req.params.id
router.get('/:id/agenda', verificarToken, tutoresController.agenda);

// GET /api/tutores/:id → detalle de un tutor
// ':id' es un parámetro dinámico — Express lo pone en req.params.id
router.get('/:id', verificarToken, tutoresController.obtener);

module.exports = router;
