// tutores.service.js - Lógica de negocio para tutores

const db = require('../config/database');

function listarTutores() {
  // Devolvemos solo los tutores activos
  const todos = db.findAll('tutores');
  const activos = [];

  for (let i = 0; i < todos.length; i++) {
    if (todos[i].activo) {
      activos.push(todos[i]);
    }
  }

  return activos;
}

function obtenerTutorPorId(id) {
  const tutor = db.findById('tutores', id);

  if (!tutor) {
    const err = new Error('Tutor no encontrado');
    err.status = 404;
    throw err;
  }

  return tutor;
}

module.exports = { listarTutores, obtenerTutorPorId };
