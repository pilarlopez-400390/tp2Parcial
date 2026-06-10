// tutores.routes.js
// Rutas del módulo de tutores — todas son públicas

const express = require('express');
const router = express.Router();
const tutoresController = require('../controllers/tutores.controller');

// GET /api/tutores → lista todos los tutores activos
router.get('/', tutoresController.listar);

// GET /api/tutores/:id → detalle de un tutor
// ':id' es un parámetro dinámico — Express lo pone en req.params.id
router.get('/:id', tutoresController.obtener);

module.exports = router;
