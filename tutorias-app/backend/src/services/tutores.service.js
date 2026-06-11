// tutores.service.js - Lógica de negocio para tutores

const db = require('../config/database');

const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

function obtenerDiaSemana(fechaStr) {
  const partes = fechaStr.split('-');
  const fecha = new Date(
    parseInt(partes[0]),
    parseInt(partes[1]) - 1,
    parseInt(partes[2])
  );
  return DIAS_SEMANA[fecha.getDay()];
}

function timeToMinutes(time) {
  const [hh, mm] = time.split(':').map(Number);
  return hh * 60 + mm;
}

function minutesToTime(minutes) {
  const hh = Math.floor(minutes / 60);
  const mm = minutes % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function haySuperposicion(ini1, fin1, ini2, fin2) {
  return ini1 < fin2 && fin1 > ini2;
}

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

function obtenerAgendaTutor(id, fecha, turnoIdIgnorar) {
  const tutor = db.findById('tutores', id);

  if (!tutor) {
    const err = new Error('Tutor no encontrado');
    err.status = 404;
    throw err;
  }

  if (!fecha) {
    const err = new Error('La fecha es obligatoria');
    err.status = 400;
    throw err;
  }

  const diaSolicitado = obtenerDiaSemana(fecha);
  const diaPermitido = tutor.activo && tutor.diasDisponibles.some(dia => dia.toLowerCase() === diaSolicitado.toLowerCase());

  const turnos = db.findAll('turnos');
  const ocupados = [];

  for (let i = 0; i < turnos.length; i++) {
    const turno = turnos[i];
    if (turno.tutorId !== id) continue;
    if (turno.fecha !== fecha) continue;
    if (turno.estado !== 'solicitado' && turno.estado !== 'confirmado') continue;
    if (turnoIdIgnorar && turno.id === turnoIdIgnorar) continue;

    ocupados.push({
      turnoId: turno.id,
      horaInicio: turno.horaInicio,
      horaFin: turno.horaFin,
      estado: turno.estado,
      tema: turno.tema
    });
  }

  ocupados.sort((a, b) => timeToMinutes(a.horaInicio) - timeToMinutes(b.horaInicio));

  return {
    tutor: {
      id: tutor.id,
      nombre: tutor.nombre,
      email: tutor.email,
      especialidad: tutor.especialidad,
      diasDisponibles: tutor.diasDisponibles,
      horarioDisponible: tutor.horarioDisponible || { inicio: '08:00', fin: '23:00' },
      activo: tutor.activo
    },
    fecha,
    diaSolicitado,
    diaPermitido,
    ocupados,
    horarioBase: tutor.horarioDisponible || { inicio: '08:00', fin: '23:00' },
    helper: {
      minutesToTime
    }
  };
}

module.exports = { listarTutores, obtenerTutorPorId, obtenerAgendaTutor };
