// seed.js - Datos semilla para el sistema de tutorías
// Crea los usuarios, tutores, turnos e historial iniciales
// para poder probar el sistema sin cargar datos a mano.
//
// Cómo ejecutar: npm run seed  (desde la carpeta backend/)

require('dotenv').config();

const bcrypt  = require('bcryptjs');
const db      = require('../config/database');

function seed() {
  console.log('🌱 Cargando datos semilla...\n');

  // Limpiamos las tablas en orden (de más dependiente a menos)
  db.clear('historial_turnos');
  db.clear('turnos');
  db.clear('tutores');
  db.clear('usuarios');

  // bcryptjs: hashSync(password, saltRounds)
  // saltRounds=10 significa que el algoritmo hace 2^10 iteraciones (balance seguridad/velocidad)
  const hash = (pwd) => bcrypt.hashSync(pwd, 10);

  // ════════════════════════════════════════════
  //  USUARIOS
  // ════════════════════════════════════════════

  // Admin
  const admin = db.insert('usuarios', {
    nombre: 'Admin Sistema', email: 'admin@dds.com',
    passwordHash: hash('admin123'), rol: 'admin', activo: true
  }); // id: 1

  // Usuarios tutores (tienen rol 'tutor' en la tabla usuarios)
  const uMarina  = db.insert('usuarios', { nombre: 'Marina López',    email: 'marina@dds.com',  passwordHash: hash('tutor123'), rol: 'tutor', activo: true });
  const uCarlos  = db.insert('usuarios', { nombre: 'Carlos Gómez',    email: 'carlos@dds.com',  passwordHash: hash('tutor123'), rol: 'tutor', activo: true });
  const uAna     = db.insert('usuarios', { nombre: 'Ana Martínez',    email: 'ana@dds.com',     passwordHash: hash('tutor123'), rol: 'tutor', activo: true });
  const uDiego   = db.insert('usuarios', { nombre: 'Diego Fernández', email: 'diego@dds.com',   passwordHash: hash('tutor123'), rol: 'tutor', activo: true });
  const uLaura   = db.insert('usuarios', { nombre: 'Laura Torres',    email: 'laura@dds.com',   passwordHash: hash('tutor123'), rol: 'tutor', activo: true });

  // Usuarios estudiantes
  const uValen = db.insert('usuarios', { nombre: 'Valen Acosta', email: 'valen@dds.com', passwordHash: hash('estudiante123'), rol: 'estudiante', activo: true });
  const uTomas = db.insert('usuarios', { nombre: 'Tomás Ruiz',   email: 'tomas@dds.com', passwordHash: hash('estudiante123'), rol: 'estudiante', activo: true });
  const uSofia = db.insert('usuarios', { nombre: 'Sofía Pérez',  email: 'sofia@dds.com', passwordHash: hash('estudiante123'), rol: 'estudiante', activo: true });

  // ════════════════════════════════════════════
  //  TUTORES
  // diasDisponibles: array con los días de la semana en minúsculas y sin tildes
  //   Días posibles: lunes, martes, miercoles, jueves, viernes, sabado, domingo
  // ════════════════════════════════════════════

  const tMarina = db.insert('tutores', {
    usuarioId: uMarina.id, nombre: 'Marina López',    email: 'marina@dds.com',
    especialidad: 'backend',   diasDisponibles: ['lunes', 'miercoles', 'viernes'], horarioDisponible: { inicio: '09:00', fin: '12:30' }, activo: true
  });
  const tCarlos = db.insert('tutores', {
    usuarioId: uCarlos.id, nombre: 'Carlos Gómez',   email: 'carlos@dds.com',
    especialidad: 'frontend',  diasDisponibles: ['martes', 'jueves'], horarioDisponible: { inicio: '10:00', fin: '17:00' }, activo: true
  });
  const tAna = db.insert('tutores', {
    usuarioId: uAna.id, nombre: 'Ana Martínez',   email: 'ana@dds.com',
    especialidad: 'testing',   diasDisponibles: ['lunes', 'martes', 'miercoles'], horarioDisponible: { inicio: '08:30', fin: '13:00' }, activo: true
  });
  const tDiego = db.insert('tutores', {
    usuarioId: uDiego.id, nombre: 'Diego Fernández', email: 'diego@dds.com',
    especialidad: 'seguridad', diasDisponibles: ['jueves', 'viernes'], horarioDisponible: { inicio: '14:00', fin: '18:30' }, activo: true
  });
  const tLaura = db.insert('tutores', {
    usuarioId: uLaura.id, nombre: 'Laura Torres',   email: 'laura@dds.com',
    especialidad: 'backend',   diasDisponibles: ['miercoles', 'jueves', 'viernes'], horarioDisponible: { inicio: '09:30', fin: '16:30' }, activo: true
  });

  // ════════════════════════════════════════════
  //  TURNOS (12 en distintos estados)
  //  Verificación de días:
  //    2026-06-09 = martes  → Carlos(martes,jueves) ✓
  //    2026-06-10 = miércoles → Marina(mierc), Ana(mierc) ✓
  //    2026-06-11 = jueves  → Carlos(jueves), Diego(jueves) ✓
  //    2026-06-02 = martes  → Carlos(martes), Ana(martes) ✓
  //    2026-06-03 = miércoles → Marina(miercoles) ✓
  //    2026-06-04 = jueves  → Laura(jueves) ✓
  //    2026-06-05 = viernes → Diego(viernes), Laura(viernes) ✓
  // ════════════════════════════════════════════

  // Solicitados (pendientes de confirmar)
  const t1  = db.insert('turnos', { tutorId: tMarina.id, estudianteId: uValen.id, fecha: '2026-07-06', horaInicio: '09:00', horaFin: '10:00', categoria: 'Backend', temas: ['JWT', 'Middlewares'], tema: 'JWT, Middlewares', modalidad: 'virtual', estado: 'solicitado', observaciones: null });
  const t2  = db.insert('turnos', { tutorId: tMarina.id, estudianteId: uTomas.id, fecha: '2026-07-08', horaInicio: '10:00', horaFin: '11:00', categoria: 'Backend', temas: ['Express Router'], tema: 'Express Router', modalidad: 'presencial', estado: 'solicitado', observaciones: null });
  const t3  = db.insert('turnos', { tutorId: tCarlos.id, estudianteId: uSofia.id, fecha: '2026-07-07', horaInicio: '14:00', horaFin: '15:00', categoria: 'Frontend', temas: ['React', 'useState', 'useEffect'], tema: 'React, useState, useEffect', modalidad: 'virtual', estado: 'solicitado', observaciones: null });

  // Confirmados
  const t4  = db.insert('turnos', { tutorId: tCarlos.id, estudianteId: uValen.id, fecha: '2026-07-09', horaInicio: '10:00', horaFin: '11:00', categoria: 'Frontend', temas: ['Vite'], tema: 'Vite', modalidad: 'virtual', estado: 'confirmado', observaciones: null });
  const t5  = db.insert('turnos', { tutorId: tAna.id,    estudianteId: uTomas.id, fecha: '2026-07-06', horaInicio: '08:30', horaFin: '09:30', categoria: 'Testing', temas: ['Jest', 'Supertest'], tema: 'Jest, Supertest', modalidad: 'presencial', estado: 'confirmado', observaciones: null });
  const t6  = db.insert('turnos', { tutorId: tDiego.id,  estudianteId: uSofia.id, fecha: '2026-07-10', horaInicio: '14:00', horaFin: '15:00', categoria: 'Seguridad', temas: ['Protección de datos sensibles', 'Buenas prácticas de seguridad'], tema: 'Protección de datos sensibles, Buenas prácticas de seguridad', modalidad: 'virtual', estado: 'confirmado', observaciones: null });

  // Realizados (pasados)
  const t7  = db.insert('turnos', { tutorId: tMarina.id, estudianteId: uSofia.id, fecha: '2026-06-03', horaInicio: '11:00', horaFin: '12:00', categoria: 'Backend', temas: ['Servicios', 'API REST'], tema: 'Servicios, API REST', modalidad: 'virtual', estado: 'realizado', observaciones: 'Repasamos require/exports a fondo' });
  const t8  = db.insert('turnos', { tutorId: tLaura.id,  estudianteId: uValen.id, fecha: '2026-06-04', horaInicio: '10:00', horaFin: '11:00', categoria: 'Backend', temas: ['Persistencia (JSON / SQLite)'], tema: 'Persistencia (JSON / SQLite)', modalidad: 'presencial', estado: 'realizado', observaciones: 'Se practicó SELECT y JOIN' });
  const t9  = db.insert('turnos', { tutorId: tAna.id,    estudianteId: uTomas.id, fecha: '2026-06-02', horaInicio: '11:30', horaFin: '12:30', categoria: 'Testing', temas: ['Pruebas de endpoints', 'Cobertura de pruebas'], tema: 'Pruebas de endpoints, Cobertura de pruebas', modalidad: 'virtual', estado: 'realizado', observaciones: null });

  // Cancelados
  const t10 = db.insert('turnos', { tutorId: tCarlos.id, estudianteId: uValen.id, fecha: '2026-06-02', horaInicio: '09:00', horaFin: '10:00', categoria: 'Frontend', temas: ['Axios'], tema: 'Axios', modalidad: 'virtual', estado: 'cancelado', observaciones: 'Cancelado por el estudiante' });
  const t11 = db.insert('turnos', { tutorId: tDiego.id,  estudianteId: uTomas.id, fecha: '2026-06-05', horaInicio: '14:00', horaFin: '15:00', categoria: 'Seguridad', temas: ['CORS', 'Roles y permisos'], tema: 'CORS, Roles y permisos', modalidad: 'presencial', estado: 'cancelado', observaciones: 'Tutor no disponible' });
  const t12 = db.insert('turnos', { tutorId: tLaura.id,  estudianteId: uSofia.id, fecha: '2026-06-04', horaInicio: '11:00', horaFin: '12:00', categoria: 'Backend', temas: ['Servicios', 'CRUD'], tema: 'Servicios, CRUD', modalidad: 'virtual', estado: 'cancelado', observaciones: 'No ha sido confirmado' });

  // ════════════════════════════════════════════
  //  HISTORIAL DE ALGUNOS TURNOS
  // ════════════════════════════════════════════

  const fechaHora = (fecha, hora) => `${fecha}T${hora}:00-03:00`;

  db.insert('historial_turnos', { turnoId: t1.id,  usuarioId: uValen.id,  accion: 'creacion',     fechaHora: fechaHora('2026-06-20', '16:15'), valorAnterior: null, valorNuevo: JSON.stringify({ estado: 'solicitado' }) });
  db.insert('historial_turnos', { turnoId: t2.id,  usuarioId: uTomas.id,  accion: 'creacion',     fechaHora: fechaHora('2026-06-21', '17:40'), valorAnterior: null, valorNuevo: JSON.stringify({ estado: 'solicitado' }) });
  db.insert('historial_turnos', { turnoId: t3.id,  usuarioId: uSofia.id,  accion: 'creacion',     fechaHora: fechaHora('2026-06-22', '18:10'), valorAnterior: null, valorNuevo: JSON.stringify({ estado: 'solicitado' }) });

  db.insert('historial_turnos', { turnoId: t4.id,  usuarioId: uValen.id,  accion: 'creacion',     fechaHora: fechaHora('2026-06-23', '09:20'), valorAnterior: null, valorNuevo: JSON.stringify({ estado: 'solicitado' }) });
  db.insert('historial_turnos', { turnoId: t4.id,  usuarioId: uCarlos.id, accion: 'confirmacion', fechaHora: fechaHora('2026-06-24', '11:35'), valorAnterior: JSON.stringify({ estado: 'solicitado' }), valorNuevo: JSON.stringify({ estado: 'confirmado' }) });

  db.insert('historial_turnos', { turnoId: t5.id,  usuarioId: uTomas.id,  accion: 'creacion',     fechaHora: fechaHora('2026-06-24', '12:05'), valorAnterior: null, valorNuevo: JSON.stringify({ estado: 'solicitado' }) });
  db.insert('historial_turnos', { turnoId: t5.id,  usuarioId: uAna.id,    accion: 'confirmacion', fechaHora: fechaHora('2026-06-25', '08:45'), valorAnterior: JSON.stringify({ estado: 'solicitado' }), valorNuevo: JSON.stringify({ estado: 'confirmado' }) });

  db.insert('historial_turnos', { turnoId: t6.id,  usuarioId: uSofia.id,  accion: 'creacion',     fechaHora: fechaHora('2026-06-25', '15:25'), valorAnterior: null, valorNuevo: JSON.stringify({ estado: 'solicitado' }) });
  db.insert('historial_turnos', { turnoId: t6.id,  usuarioId: uDiego.id,  accion: 'confirmacion', fechaHora: fechaHora('2026-06-26', '17:50'), valorAnterior: JSON.stringify({ estado: 'solicitado' }), valorNuevo: JSON.stringify({ estado: 'confirmado' }) });

  db.insert('historial_turnos', { turnoId: t7.id,  usuarioId: uSofia.id,  accion: 'creacion',     fechaHora: fechaHora('2026-06-02', '18:20'), valorAnterior: null, valorNuevo: JSON.stringify({ estado: 'solicitado' }) });
  db.insert('historial_turnos', { turnoId: t7.id,  usuarioId: uMarina.id, accion: 'confirmacion', fechaHora: fechaHora('2026-06-03', '08:15'), valorAnterior: JSON.stringify({ estado: 'solicitado' }), valorNuevo: JSON.stringify({ estado: 'confirmado' }) });
  db.insert('historial_turnos', { turnoId: t7.id,  usuarioId: uMarina.id, accion: 'realizacion',  fechaHora: fechaHora('2026-06-03', '11:00'), valorAnterior: JSON.stringify({ estado: 'confirmado' }), valorNuevo: JSON.stringify({ estado: 'realizado' }) });

  db.insert('historial_turnos', { turnoId: t8.id,  usuarioId: uValen.id,  accion: 'creacion',     fechaHora: fechaHora('2026-06-03', '14:10'), valorAnterior: null, valorNuevo: JSON.stringify({ estado: 'solicitado' }) });
  db.insert('historial_turnos', { turnoId: t8.id,  usuarioId: uLaura.id,  accion: 'confirmacion', fechaHora: fechaHora('2026-06-03', '16:35'), valorAnterior: JSON.stringify({ estado: 'solicitado' }), valorNuevo: JSON.stringify({ estado: 'confirmado' }) });
  db.insert('historial_turnos', { turnoId: t8.id,  usuarioId: uLaura.id,  accion: 'realizacion',  fechaHora: fechaHora('2026-06-04', '10:00'), valorAnterior: JSON.stringify({ estado: 'confirmado' }), valorNuevo: JSON.stringify({ estado: 'realizado' }) });

  db.insert('historial_turnos', { turnoId: t9.id,  usuarioId: uTomas.id,  accion: 'creacion',     fechaHora: fechaHora('2026-06-01', '10:30'), valorAnterior: null, valorNuevo: JSON.stringify({ estado: 'solicitado' }) });
  db.insert('historial_turnos', { turnoId: t9.id,  usuarioId: uAna.id,    accion: 'confirmacion', fechaHora: fechaHora('2026-06-01', '13:15'), valorAnterior: JSON.stringify({ estado: 'solicitado' }), valorNuevo: JSON.stringify({ estado: 'confirmado' }) });
  db.insert('historial_turnos', { turnoId: t9.id,  usuarioId: uAna.id,    accion: 'realizacion',  fechaHora: fechaHora('2026-06-02', '11:30'), valorAnterior: JSON.stringify({ estado: 'confirmado' }), valorNuevo: JSON.stringify({ estado: 'realizado' }) });

  db.insert('historial_turnos', { turnoId: t10.id, usuarioId: uValen.id,  accion: 'creacion',     fechaHora: fechaHora('2026-06-01', '11:45'), valorAnterior: null, valorNuevo: JSON.stringify({ estado: 'solicitado' }) });
  db.insert('historial_turnos', { turnoId: t10.id, usuarioId: uValen.id,  accion: 'cancelacion',  fechaHora: fechaHora('2026-06-01', '19:05'), valorAnterior: JSON.stringify({ estado: 'solicitado' }), valorNuevo: JSON.stringify({ estado: 'cancelado', observaciones: 'Cancelado por el estudiante' }) });

  db.insert('historial_turnos', { turnoId: t11.id, usuarioId: uTomas.id,  accion: 'creacion',     fechaHora: fechaHora('2026-06-04', '09:25'), valorAnterior: null, valorNuevo: JSON.stringify({ estado: 'solicitado' }) });
  db.insert('historial_turnos', { turnoId: t11.id, usuarioId: admin.id,   accion: 'cancelacion',  fechaHora: fechaHora('2026-06-04', '16:00'), valorAnterior: JSON.stringify({ estado: 'solicitado' }), valorNuevo: JSON.stringify({ estado: 'cancelado', observaciones: 'Tutor no disponible' }) });

  db.insert('historial_turnos', { turnoId: t12.id, usuarioId: uSofia.id,  accion: 'creacion',     fechaHora: fechaHora('2026-06-03', '17:15'), valorAnterior: null, valorNuevo: JSON.stringify({ estado: 'solicitado' }) });
  db.insert('historial_turnos', { turnoId: t12.id, usuarioId: uSofia.id,  accion: 'cancelacion',  fechaHora: fechaHora('2026-06-04', '08:50'), valorAnterior: JSON.stringify({ estado: 'solicitado' }), valorNuevo: JSON.stringify({ estado: 'cancelado', observaciones: 'No ha sido confirmado' }) });

  console.log('✅ Semilla cargada exitosamente!\n');
  console.log('📋 Credenciales de prueba:');
  console.log('┌─────────────┬──────────────────────────┬──────────────────┐');
  console.log('│ Rol         │ Email                    │ Contraseña       │');
  console.log('├─────────────┼──────────────────────────┼──────────────────┤');
  console.log('│ Admin       │ admin@dds.com            │ admin123         │');
  console.log('│ Tutor       │ marina@dds.com           │ tutor123         │');
  console.log('│ Tutor       │ carlos@dds.com           │ tutor123         │');
  console.log('│ Tutor       │ ana@dds.com              │ tutor123         │');
  console.log('│ Tutor       │ diego@dds.com            │ tutor123         │');
  console.log('│ Tutor       │ laura@dds.com            │ tutor123         │');
  console.log('│ Estudiante  │ valen@dds.com            │ estudiante123    │');
  console.log('│ Estudiante  │ tomas@dds.com            │ estudiante123    │');
  console.log('│ Estudiante  │ sofia@dds.com            │ estudiante123    │');
  console.log('└─────────────┴──────────────────────────┴──────────────────┘');
}

// Si ejecutamos el archivo directamente (node seed.js), corremos la función
if (require.main === module) {
  seed();
}

// También lo exportamos para usarlo en los tests
module.exports = seed;
