// turnos.service.js - Lógica de negocio principal del dominio
//
// Acá viven las reglas más importantes:
//   1. Verificar disponibilidad del tutor (activo + día + sin superposición)
//   2. Máquina de estados: solicitado → confirmado/cancelado → realizado/cancelado
//   3. Historial de cambios

const db = require('../config/database');

// ── HELPERS ──────────────────────────────────────────────────────────────────

// Mapeo de índice de getDay() a nombre español sin tildes
// getDay(): 0=domingo, 1=lunes, ..., 6=sábado
const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

// Convierte 'YYYY-MM-DD' al nombre del día en español
// Parseamos como fecha LOCAL para evitar problemas de zona horaria (UTC vs ART).
function obtenerDiaSemana(fechaStr) {
  const partes = fechaStr.split('-');
  // new Date(año, mes-1, día) crea la fecha en hora local, sin offset UTC
  const fecha = new Date(
    parseInt(partes[0]),
    parseInt(partes[1]) - 1,  // Los meses en JS van de 0 (enero) a 11 (diciembre)
    parseInt(partes[2])
  );
  return DIAS_SEMANA[fecha.getDay()];
}

// Verifica si dos franjas horarias se superponen.
// Las horas son strings 'HH:MM'. Como tienen formato fijo, la comparación
// de strings funciona igual que comparación numérica (ej: '09:30' < '10:00' → true).
//
// Regla del enunciado: si uno termina EXACTAMENTE cuando el otro empieza, NO hay superposición.
// Por eso usamos < y > estrictos (no <= ni >=).
//
// Ejemplo:
//   09:00-09:30 vs 09:15-09:45 → '09:00'<'09:45' (true) y '09:30'>'09:15' (true) → SUPERPUESTO
//   09:00-09:30 vs 09:30-10:00 → '09:00'<'10:00' (true) pero '09:30'>'09:30' (false) → NO SUPERPUESTO
function haySuperposicion(ini1, fin1, ini2, fin2) {
  return ini1 < fin2 && fin1 > ini2;
}

// Registra un cambio en el historial del turno
function registrarHistorial(turnoId, usuarioId, accion, valorAnterior, valorNuevo) {
  db.insert('historial_turnos', {
    turnoId,
    usuarioId,
    accion,
    fechaHora:     new Date().toISOString(),
    valorAnterior: valorAnterior ? JSON.stringify(valorAnterior) : null,
    valorNuevo:    valorNuevo    ? JSON.stringify(valorNuevo)    : null
  });
}

// Verifica que el tutor pueda recibir un turno en esa fecha y horario.
// turnoIdIgnorar: cuando EDITAMOS un turno, ignoramos el propio turno
//                al chequear superposición (no puede conflictuarse consigo mismo).
function verificarDisponibilidad(tutor, fecha, horaInicio, horaFin, turnoIdIgnorar) {

  // 1. El tutor debe estar activo
  if (!tutor.activo) {
    const err = new Error('El tutor no está activo y no puede recibir turnos');
    err.status = 400;
    throw err;
  }

  // 2. El tutor debe tener ese día de la semana en su lista de días disponibles
  const diaSolicitado = obtenerDiaSemana(fecha);
  let diaEncontrado = false;

  for (let i = 0; i < tutor.diasDisponibles.length; i++) {
    if (tutor.diasDisponibles[i].toLowerCase() === diaSolicitado.toLowerCase()) {
      diaEncontrado = true;
      break;
    }
  }

  if (!diaEncontrado) {
    const err = new Error(`El tutor no atiende los ${diaSolicitado}. Días disponibles: ${tutor.diasDisponibles.join(', ')}`);
    err.status = 400;
    throw err;
  }

  // 3. No debe haber superposición con turnos activos del mismo tutor en esa fecha
  //    "Activos" = solicitado o confirmado (cancelado y realizado no bloquean)
  const todosLosTurnos = db.findAll('turnos');

  for (let i = 0; i < todosLosTurnos.length; i++) {
    const t = todosLosTurnos[i];

    // Ignoramos si es de otro tutor o de otra fecha
    if (t.tutorId !== tutor.id) continue;
    if (t.fecha   !== fecha)    continue;
    // Solo turnos solicitados o confirmados bloquean la agenda
    if (t.estado !== 'solicitado' && t.estado !== 'confirmado') continue;
    // Al editar, ignoramos el propio turno
    if (turnoIdIgnorar && t.id === turnoIdIgnorar) continue;

    if (haySuperposicion(horaInicio, horaFin, t.horaInicio, t.horaFin)) {
      const err = new Error(
        `El tutor ya tiene un turno de ${t.horaInicio} a ${t.horaFin} en esa fecha. No se puede superponer.`
      );
      err.status = 400;
      throw err;
    }
  }
}

// ── LISTAR TURNOS ─────────────────────────────────────────────────────────────

// Parámetros de query: fecha, estado, tutorId, especialidad, estudianteId, page, limit, sortBy, order
function listarTurnos({ fecha, estado, tutorId, especialidad, estudianteId,
                        page = 1, limit = 10, sortBy = 'fecha', order = 'asc' } = {}, usuario) {

  let turnos    = db.findAll('turnos');
  const tutores = db.findAll('tutores');
  const usuarios = db.findAll('usuarios');

  if (usuario.rol === 'estudiante') {
    turnos = turnos.filter(t => t.estudianteId === usuario.id)
  } else if (usuario.rol === 'tutor') {
    const tutoresUsuario = tutores.filter(t => t.usuarioId === usuario.id)
    const tutorIds = tutoresUsuario.map(t => t.id)
    turnos = turnos.filter(t => tutorIds.includes(t.tutorId))
  }

  // ── Filtros ─────────────────────────────────────────────────────────────
  if (fecha) {
    const filtrados = [];
    for (let i = 0; i < turnos.length; i++) {
      if (turnos[i].fecha === fecha) filtrados.push(turnos[i]);
    }
    turnos = filtrados;
  }

  if (estado) {
    const filtrados = [];
    for (let i = 0; i < turnos.length; i++) {
      if (turnos[i].estado === estado) filtrados.push(turnos[i]);
    }
    turnos = filtrados;
  }

  if (tutorId) {
    const id = parseInt(tutorId);
    const filtrados = [];
    for (let i = 0; i < turnos.length; i++) {
      if (turnos[i].tutorId === id) filtrados.push(turnos[i]);
    }
    turnos = filtrados;
  }

  if (estudianteId) {
    const id = parseInt(estudianteId);
    const filtrados = [];
    for (let i = 0; i < turnos.length; i++) {
      if (turnos[i].estudianteId === id) filtrados.push(turnos[i]);
    }
    turnos = filtrados;
  }

  if (especialidad) {
    // Primero obtenemos los ids de tutores con esa especialidad
    const idsConEspecialidad = [];
    for (let i = 0; i < tutores.length; i++) {
      if (tutores[i].especialidad === especialidad) {
        idsConEspecialidad.push(tutores[i].id);
      }
    }
    const filtrados = [];
    for (let i = 0; i < turnos.length; i++) {
      if (idsConEspecialidad.includes(turnos[i].tutorId)) filtrados.push(turnos[i]);
    }
    turnos = filtrados;
  }

  // ── Enriquecer con datos de tutor y estudiante ──────────────────────────
  for (let i = 0; i < turnos.length; i++) {
    let tutorNombre = 'Desconocido';
    let tutorEsp    = '';
    for (let j = 0; j < tutores.length; j++) {
      if (tutores[j].id === turnos[i].tutorId) {
        tutorNombre = tutores[j].nombre;
        tutorEsp    = tutores[j].especialidad;
        break;
      }
    }
    let estudianteNombre = 'Desconocido';
    for (let j = 0; j < usuarios.length; j++) {
      if (usuarios[j].id === turnos[i].estudianteId) {
        estudianteNombre = usuarios[j].nombre;
        break;
      }
    }
    // Agregamos los campos extra sin modificar el original
    turnos[i] = { ...turnos[i], tutorNombre, tutorEspecialidad: tutorEsp, estudianteNombre };
  }

  // ── Ordenar ─────────────────────────────────────────────────────────────
  const camposValidos = ['fecha', 'estado', 'horaInicio', 'tema'];
  const campo = camposValidos.includes(sortBy) ? sortBy : 'fecha';
  const ascendente = order.toLowerCase() !== 'desc';

  turnos.sort(function (a, b) {
    if (a[campo] < b[campo]) return ascendente ? -1 : 1;
    if (a[campo] > b[campo]) return ascendente ?  1 : -1;
    return 0;
  });

  // ── Paginación ───────────────────────────────────────────────────────────
  const pageNum  = parseInt(page)  || 1;
  const limitNum = parseInt(limit) || 10;
  const total    = turnos.length;
  const inicio   = (pageNum - 1) * limitNum;
  const fin      = inicio + limitNum;
  const data     = turnos.slice(inicio, fin);

  return {
    data,
    pagination: {
      total,
      page:       pageNum,
      limit:      limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  };
}

// ── OBTENER TURNO POR ID ──────────────────────────────────────────────────────

function obtenerTurnoPorId(id, usuario) {
  const turno = db.findById('turnos', id);

  if (!turno) {
    const err = new Error('Turno no encontrado');
    err.status = 404;
    throw err;
  }

  if (usuario.rol === 'estudiante' && turno.estudianteId !== usuario.id) {
    const err = new Error('No tenés permiso para ver este turno');
    err.status = 403;
    throw err;
  }

  if (usuario.rol === 'tutor') {
    const tutores = db.findAll('tutores')
    const tutorDelUsuario = tutores.find(t => t.usuarioId === usuario.id)
    if (!tutorDelUsuario || tutorDelUsuario.id !== turno.tutorId) {
      const err = new Error('No tenés permiso para ver este turno');
      err.status = 403;
      throw err;
    }
  }

  // Enriquecemos con el nombre del tutor y del estudiante
  const tutores  = db.findAll('tutores');
  const usuarios = db.findAll('usuarios');

  let tutorNombre = 'Desconocido';
  let tutorEsp    = '';
  for (let i = 0; i < tutores.length; i++) {
    if (tutores[i].id === turno.tutorId) {
      tutorNombre = tutores[i].nombre;
      tutorEsp    = tutores[i].especialidad;
      break;
    }
  }

  let estudianteNombre = 'Desconocido';
  for (let i = 0; i < usuarios.length; i++) {
    if (usuarios[i].id === turno.estudianteId) {
      estudianteNombre = usuarios[i].nombre;
      break;
    }
  }

  return { ...turno, tutorNombre, tutorEspecialidad: tutorEsp, estudianteNombre };
}

// ── CREAR TURNO ───────────────────────────────────────────────────────────────

function crearTurno({ tutorId, estudianteId, fecha, horaInicio, horaFin, tema, modalidad, observaciones }, usuario) {

  // Validación 1: horario coherente (inicio debe ser menor que fin)
  if (horaInicio >= horaFin) {
    const err = new Error('La hora de inicio debe ser anterior a la hora de fin');
    err.status = 400;
    throw err;
  }

  if (usuario.rol === 'estudiante') {
    estudianteId = usuario.id
  }

  if (usuario.rol === 'tutor') {
    const tutores = db.findAll('tutores')
    const tutorDelUsuario = tutores.find(t => t.usuarioId === usuario.id)
    if (!tutorDelUsuario) {
      const err = new Error('No se encontró el registro de tutor asociado');
      err.status = 403;
      throw err;
    }
    tutorId = tutorDelUsuario.id
  }

  if (usuario.rol === 'estudiante' && estudianteId !== usuario.id) {
    const err = new Error('Un estudiante solo puede crear sus propios turnos');
    err.status = 403;
    throw err;
  }

  if (!estudianteId) {
    const err = new Error('El estudiante es obligatorio');
    err.status = 400;
    throw err;
  }

  // Validación 2: el tutor debe existir
  const tutor = db.findById('tutores', tutorId);
  if (!tutor) {
    const err = new Error('El tutor no existe');
    err.status = 404;
    throw err;
  }

  // Validación 3: disponibilidad (activo + día + sin superposición)
  verificarDisponibilidad(tutor, fecha, horaInicio, horaFin, null);

  // Insertar el turno con estado inicial 'solicitado'
  const nuevoTurno = db.insert('turnos', {
    tutorId, estudianteId, fecha, horaInicio, horaFin,
    tema, modalidad, estado: 'solicitado',
    observaciones: observaciones || null
  });

  // Registrar en el historial
  registrarHistorial(nuevoTurno.id, estudianteId, 'creacion', null, {
    estado: 'solicitado', tutorId, fecha, horaInicio, horaFin, tema, modalidad
  });

  return obtenerTurnoPorId(nuevoTurno.id, usuario);
}

// ── EDITAR TURNO ──────────────────────────────────────────────────────────────

function editarTurno(turnoId, datos, usuarioId, usuarioRol) {
  const turno = db.findById('turnos', turnoId);
  if (!turno) {
    const err = new Error('Turno no encontrado');
    err.status = 404;
    throw err;
  }

  if (usuarioRol === 'estudiante') {
    const err = new Error('Los estudiantes no pueden editar turnos');
    err.status = 403;
    throw err;
  }

  if (usuarioRol === 'tutor') {
    const tutores = db.findAll('tutores')
    const tutorDelUsuario = tutores.find(t => t.usuarioId === usuarioId)
    if (!tutorDelUsuario || tutorDelUsuario.id !== turno.tutorId) {
      const err = new Error('Solo el tutor asignado puede editar este turno');
      err.status = 403;
      throw err;
    }
    if (datos.tutorId && parseInt(datos.tutorId) !== turno.tutorId) {
      const err = new Error('Un tutor no puede cambiar el tutor asignado');
      err.status = 403;
      throw err;
    }
  }

  // Los turnos cancelados no se pueden editar
  if (turno.estado === 'cancelado') {
    const err = new Error('No se puede editar un turno cancelado');
    err.status = 400;
    throw err;
  }

  // Los turnos realizados solo permiten editar observaciones
  if (turno.estado === 'realizado') {
    const camposInvalidos = Object.keys(datos).filter(k => k !== 'observaciones');
    if (camposInvalidos.length > 0) {
      const err = new Error('Un turno realizado solo puede actualizarse en el campo observaciones');
      err.status = 400;
      throw err;
    }
    db.update('turnos', turnoId, { observaciones: datos.observaciones });
    return obtenerTurnoPorId(turnoId, { id: usuarioId, rol: usuarioRol });
  }

  // Guardamos estado anterior para historial
  const valorAnterior = {
    tutorId:    turno.tutorId,
    fecha:      turno.fecha,
    horaInicio: turno.horaInicio,
    horaFin:    turno.horaFin,
    tema:       turno.tema,
    modalidad:  turno.modalidad
  };

  // Usamos los nuevos valores o los actuales si no se enviaron
  const nuevoTutorId = datos.tutorId    ? parseInt(datos.tutorId) : turno.tutorId;
  const nuevaFecha   = datos.fecha      || turno.fecha;
  const nuevoInicio  = datos.horaInicio || turno.horaInicio;
  const nuevoFin     = datos.horaFin    || turno.horaFin;

  // Revalidar horario
  if (nuevoInicio >= nuevoFin) {
    const err = new Error('La hora de inicio debe ser anterior a la hora de fin');
    err.status = 400;
    throw err;
  }

  // Si cambia el tutor, verificar que exista
  const tutorFinal = db.findById('tutores', nuevoTutorId);
  if (!tutorFinal) {
    const err = new Error('El tutor seleccionado no existe');
    err.status = 404;
    throw err;
  }

  // Verificar disponibilidad, ignorando el propio turno al buscar superposiciones
  verificarDisponibilidad(tutorFinal, nuevaFecha, nuevoInicio, nuevoFin, turnoId);

  // Actualizar
  db.update('turnos', turnoId, {
    tutorId:      nuevoTutorId,
    fecha:        nuevaFecha,
    horaInicio:   nuevoInicio,
    horaFin:      nuevoFin,
    tema:         datos.tema      || turno.tema,
    modalidad:    datos.modalidad || turno.modalidad,
    observaciones: datos.observaciones !== undefined ? datos.observaciones : turno.observaciones
  });

  registrarHistorial(turnoId, usuarioId, 'edicion', valorAnterior, {
    tutorId: nuevoTutorId, fecha: nuevaFecha,
    horaInicio: nuevoInicio, horaFin: nuevoFin,
    tema: datos.tema || turno.tema, modalidad: datos.modalidad || turno.modalidad
  });

  return obtenerTurnoPorId(turnoId, { id: usuarioId, rol: usuarioRol });
}

// ── CANCELAR TURNO ────────────────────────────────────────────────────────────
// Máquina de estados: solicitado ↓ cancelado
//                    confirmado  ↓ cancelado

function cancelarTurno(turnoId, usuarioId, usuarioRol) {
  const turno = db.findById('turnos', turnoId);
  if (!turno) {
    const err = new Error('Turno no encontrado');
    err.status = 404;
    throw err;
  }

  if (turno.estado !== 'solicitado' && turno.estado !== 'confirmado') {
    const err = new Error(`No se puede cancelar un turno en estado "${turno.estado}"`);
    err.status = 400;
    throw err;
  }

  if (usuarioRol === 'estudiante') {
    if (turno.estudianteId !== usuarioId) {
      const err = new Error('Solo podés cancelar tus propios turnos');
      err.status = 403;
      throw err;
    }
  }

  if (usuarioRol === 'tutor') {
    const tutores = db.findAll('tutores')
    const tutorDelUsuario = tutores.find(t => t.usuarioId === usuarioId)
    if (!tutorDelUsuario || tutorDelUsuario.id !== turno.tutorId) {
      const err = new Error('Solo el tutor asignado puede cancelar este turno');
      err.status = 403;
      throw err;
    }
  }

  const estadoAnterior = turno.estado;
  db.update('turnos', turnoId, { estado: 'cancelado' });

  registrarHistorial(turnoId, usuarioId, 'cancelacion',
    { estado: estadoAnterior }, { estado: 'cancelado' }
  );

  return obtenerTurnoPorId(turnoId, { id: usuarioId, rol: usuarioRol });
}

// ── CONFIRMAR TURNO ───────────────────────────────────────────────────────────
// Máquina de estados: solicitado → confirmado
// Solo el tutor ASIGNADO o un admin pueden confirmar.

function confirmarTurno(turnoId, usuarioId, usuarioRol) {
  const turno = db.findById('turnos', turnoId);
  if (!turno) {
    const err = new Error('Turno no encontrado');
    err.status = 404;
    throw err;
  }

  if (turno.estado !== 'solicitado') {
    const err = new Error('Solo se pueden confirmar turnos en estado "solicitado"');
    err.status = 400;
    throw err;
  }

  if (usuarioRol === 'tutor') {
    const tutores = db.findAll('tutores');
    const tutorDelUsuario = tutores.find(t => t.usuarioId === usuarioId)
    if (!tutorDelUsuario || tutorDelUsuario.id !== turno.tutorId) {
      const err = new Error('Solo el tutor asignado a este turno puede confirmarlo');
      err.status = 403;
      throw err;
    }
  }

  db.update('turnos', turnoId, { estado: 'confirmado' });
  registrarHistorial(turnoId, usuarioId, 'confirmacion',
    { estado: 'solicitado' }, { estado: 'confirmado' }
  );
  return obtenerTurnoPorId(turnoId, { id: usuarioId, rol: usuarioRol });
}

// ── REALIZAR TURNO ────────────────────────────────────────────────────────────
// Máquina de estados: confirmado → realizado
// Solo el tutor ASIGNADO o un admin pueden marcar como realizado.

function realizarTurno(turnoId, observaciones, usuarioId, usuarioRol) {
  const turno = db.findById('turnos', turnoId);
  if (!turno) {
    const err = new Error('Turno no encontrado');
    err.status = 404;
    throw err;
  }

  if (turno.estado !== 'confirmado') {
    const err = new Error('Solo se pueden marcar como realizados turnos en estado "confirmado"');
    err.status = 400;
    throw err;
  }

  if (usuarioRol === 'tutor') {
    const tutores = db.findAll('tutores');
    const tutorDelUsuario = tutores.find(t => t.usuarioId === usuarioId)
    if (!tutorDelUsuario || tutorDelUsuario.id !== turno.tutorId) {
      const err = new Error('Solo el tutor asignado a este turno puede marcarlo como realizado');
      err.status = 403;
      throw err;
    }
  }

  db.update('turnos', turnoId, {
    estado: 'realizado',
    observaciones: observaciones !== undefined ? observaciones : turno.observaciones
  });

  registrarHistorial(turnoId, usuarioId, 'realizacion',
    { estado: 'confirmado' }, { estado: 'realizado' }
  );
  return obtenerTurnoPorId(turnoId, { id: usuarioId, rol: usuarioRol });
}

// ── HISTORIAL ─────────────────────────────────────────────────────────────────

function obtenerHistorial(turnoId, usuario) {
  const turno = db.findById('turnos', turnoId);
  if (!turno) {
    const err = new Error('Turno no encontrado');
    err.status = 404;
    throw err;
  }

  if (usuario.rol === 'estudiante' && turno.estudianteId !== usuario.id) {
    const err = new Error('No tenés permiso para ver este historial');
    err.status = 403;
    throw err;
  }

  if (usuario.rol === 'tutor') {
    const tutores = db.findAll('tutores')
    const tutorDelUsuario = tutores.find(t => t.usuarioId === usuario.id)
    if (!tutorDelUsuario || tutorDelUsuario.id !== turno.tutorId) {
      const err = new Error('No tenés permiso para ver este historial');
      err.status = 403;
      throw err;
    }
  }

  const todosHistoriales = db.findAll('historial_turnos');
  const usuarios         = db.findAll('usuarios');

  // Filtramos por turnoId
  const historial = [];
  for (let i = 0; i < todosHistoriales.length; i++) {
    if (todosHistoriales[i].turnoId === turnoId) {
      let usuarioNombre = 'Desconocido';
      const uid = todosHistoriales[i].usuarioId;

      // uid puede ser un número (caso normal) o un objeto JWT completo (dato histórico corrupto)
      if (uid && typeof uid === 'object' && uid.nombre) {
        usuarioNombre = uid.nombre;
      } else {
        for (let j = 0; j < usuarios.length; j++) {
          if (usuarios[j].id === uid) {
            usuarioNombre = usuarios[j].nombre;
            break;
          }
        }
      }
      historial.push({ ...todosHistoriales[i], usuarioNombre });
    }
  }

  // Ordenar por fechaHora ascendente (más antiguo primero)
  historial.sort(function (a, b) {
    if (a.fechaHora < b.fechaHora) return -1;
    if (a.fechaHora > b.fechaHora) return  1;
    return 0;
  });

  return historial;
}

// ── RESUMEN (solo admin) ──────────────────────────────────────────────────────

function obtenerResumen() {
  const hoy    = new Date().toISOString().split('T')[0];  // 'YYYY-MM-DD'
  const turnos = db.findAll('turnos');
  const tutores = db.findAll('tutores');

  // Turnos del día
  let turnosHoy = 0;
  for (let i = 0; i < turnos.length; i++) {
    if (turnos[i].fecha === hoy) turnosHoy++;
  }

  // Turnos pendientes de confirmación
  let turnosPendientes = 0;
  for (let i = 0; i < turnos.length; i++) {
    if (turnos[i].estado === 'solicitado') turnosPendientes++;
  }

  // Turnos por tutor (objeto { tutorNombre: cantidad })
  const porTutorMap = {};
  for (let i = 0; i < turnos.length; i++) {
    const tid = turnos[i].tutorId;
    let nombre = `Tutor ${tid}`;
    for (let j = 0; j < tutores.length; j++) {
      if (tutores[j].id === tid) { nombre = tutores[j].nombre; break; }
    }
    porTutorMap[nombre] = (porTutorMap[nombre] || 0) + 1;
  }
  const turnosPorTutor = [];
  for (const nombre in porTutorMap) {
    turnosPorTutor.push({ nombre, cantidad: porTutorMap[nombre] });
  }
  turnosPorTutor.sort((a, b) => b.cantidad - a.cantidad);

  // Temas más solicitados
  const temaMap = {};
  for (let i = 0; i < turnos.length; i++) {
    const tema = turnos[i].tema;
    temaMap[tema] = (temaMap[tema] || 0) + 1;
  }
  const temasMasSolicitados = [];
  for (const tema in temaMap) {
    temasMasSolicitados.push({ tema, cantidad: temaMap[tema] });
  }
  temasMasSolicitados.sort((a, b) => b.cantidad - a.cantidad);
  const topTemas = temasMasSolicitados.slice(0, 5);

  return { turnosHoy, turnosPendientes, turnosPorTutor, temasMasSolicitados: topTemas };
}

module.exports = {
  listarTurnos, obtenerTurnoPorId,
  crearTurno, editarTurno,
  cancelarTurno, confirmarTurno, realizarTurno,
  obtenerHistorial, obtenerResumen
};
