// tutores.controller.js
// Maneja las rutas GET /api/tutores y GET /api/tutores/:id
// Estas rutas son PÚBLICAS (no requieren JWT) según el enunciado

const tutoresService = require('../services/tutores.service');

// GET /api/tutores
// Retorna todos los tutores activos
async function listar(req, res, next) {
  try {
    const tutores = await tutoresService.listarTutores();
    res.status(200).json(tutores);
  } catch (err) {
    next(err);
  }
}

// GET /api/tutores/:id
// Retorna el detalle de un tutor específico
// req.params.id contiene el ":id" de la URL — ej: /api/tutores/3 → id = "3"
async function obtener(req, res, next) {
  try {
    // Convertimos a número con parseInt porque los IDs en JSON son números
    const id = parseInt(req.params.id);
    const tutor = await tutoresService.obtenerTutorPorId(id);
    res.status(200).json(tutor);
  } catch (err) {
    next(err);
  }
}

// GET /api/tutores/:id/agenda?fecha=YYYY-MM-DD
async function agenda(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { fecha, turnoId } = req.query;
    const agendaTutor = await tutoresService.obtenerAgendaTutor(id, fecha, turnoId ? parseInt(turnoId) : null);
    res.status(200).json(agendaTutor);
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, obtener, agenda };
