// turnos.routes.js
// Rutas del módulo principal — la mayoría requieren JWT

const express = require('express');
const router = express.Router();
const turnosController = require('../controllers/turnos.controller');
// El auth.middleware exporta la función directamente (sin objeto), entonces importamos así:
const verificarToken = require('../middlewares/auth.middleware');
const autorizar = require('../middlewares/authorize.middleware');
const { validarBody } = require('../middlewares/validate.middleware');

// IMPORTANTE: el orden importa en Express.
// La ruta '/resumen' DEBE ir ANTES de '/:id'.
// Si no, Express interpretaría la palabra "resumen" como un id.
// Ejemplo sin orden correcto:
//   GET /api/turnos/resumen → Express pensaría que id = "resumen" ← MAL

// GET /api/turnos — lista con filtros (cualquier usuario autenticado)
router.get('/', verificarToken, turnosController.listar);

// GET /api/turnos/resumen — solo admin
// verificarToken verifica que haya JWT válido
// autorizar('admin') verifica que el rol sea admin
router.get('/resumen', verificarToken, autorizar('admin'), turnosController.resumen);

// GET /api/turnos/:id/historial — historial de cambios
router.get('/:id/historial', verificarToken, turnosController.historial);

// GET /api/turnos/:id — detalle de un turno
router.get('/:id', verificarToken, turnosController.obtener);

// POST /api/turnos — crear turno (estudiante o admin)
router.post('/', verificarToken, autorizar('estudiante', 'admin'), validarBody({
  requeridos: ['tutorId', 'fecha', 'horaInicio', 'horaFin', 'modalidad'],
  permitidos: ['tutorId', 'estudianteId', 'fecha', 'horaInicio', 'horaFin', 'categoria', 'temas', 'tema', 'modalidad', 'observaciones']
}), turnosController.crear);

// PUT /api/turnos/:id — editar turno (cualquier autenticado, el service valida permisos)
router.put('/:id', verificarToken, validarBody({
  permitidos: ['tutorId', 'fecha', 'horaInicio', 'horaFin', 'categoria', 'temas', 'tema', 'modalidad', 'observaciones']
}), turnosController.editar);

// PATCH /api/turnos/:id/cancelar — cancelar (cualquier autenticado, el service valida)
router.patch('/:id/cancelar', verificarToken, validarBody({
  permitidos: ['observaciones']
}), turnosController.cancelar);

// PATCH /api/turnos/:id/confirmar — solo tutor o admin
router.patch('/:id/confirmar', verificarToken, autorizar('tutor', 'admin'), turnosController.confirmar);

// PATCH /api/turnos/:id/realizar — solo tutor o admin
router.patch('/:id/realizar', verificarToken, autorizar('tutor', 'admin'), validarBody({
  permitidos: ['observaciones']
}), turnosController.realizar);

module.exports = router;
