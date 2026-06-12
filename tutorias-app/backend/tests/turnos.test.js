// tests/turnos.test.js
// Tests automatizados del backend con Jest + Supertest
//
// ¿Cómo funciona Supertest?
//   const request = require('supertest');
//   const app = require('../app');
//   await request(app).get('/api/tutores').expect(200)
//
// request(app) crea un servidor HTTP temporal para ese test.
// No necesitamos que el servidor esté corriendo en ningún puerto.
//
// beforeAll / afterAll / beforeEach: lifecycle hooks de Jest
//   beforeAll  → se ejecuta UNA sola vez al principio de toda la suite
//   afterAll   → se ejecuta UNA sola vez al final
//   beforeEach → se ejecuta ANTES de cada test individual

process.env.NODE_ENV = 'test'; // Hace que database.js use data-test/
require('dotenv').config();     // Carga .env para JWT_SECRET

const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../app');
const seed = require('../src/seed/seed');
const db = require('../src/config/database');

// Variables para reutilizar tokens entre tests
let tokenAdmin;
let tokenEstudiante;
let tokenTutor;

// beforeEach: deja cada test con datos limpios y predecibles
beforeEach(async () => {
  // Reseteamos los datos de test y cargamos la semilla
  // db.clear y seed son SÍNCRONOS (usan fs.readFileSync/writeFileSync)
  db.clear('usuarios');
  db.clear('tutores');
  db.clear('turnos');
  db.clear('historial_turnos');
  seed(); // Ejecuta el seed.js en modo test (usa data-test/)

  // Hacemos login una vez y guardamos los tokens para reutilizarlos
  // Así no repetimos el login en cada test
  const resAdmin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@dds.com', password: 'admin123' });
  tokenAdmin = resAdmin.body.token;

  const resEst = await request(app)
    .post('/api/auth/login')
    .send({ email: 'valen@dds.com', password: 'estudiante123' });
  tokenEstudiante = resEst.body.token;

  const resTutor = await request(app)
    .post('/api/auth/login')
    .send({ email: 'marina@dds.com', password: 'tutor123' });
  tokenTutor = resTutor.body.token;
});

// afterAll: limpia los datos de test al terminar
afterAll(async () => {
  db.clear('usuarios');
  db.clear('tutores');
  db.clear('turnos');
  db.clear('historial_turnos');
});

// ============================================================
// TEST 1: Login correcto e inválido
// ============================================================
describe('1. Autenticación', () => {

  test('Registro crea usuario con contraseña hasheada', async () => {
    const email = 'nuevo.estudiante@dds.com';
    const password = 'claveSegura123';

    const res = await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'Nuevo Estudiante', email, password });

    expect(res.status).toBe(201);
    expect(res.body.usuario).toMatchObject({ nombre: 'Nuevo Estudiante', email, rol: 'estudiante' });
    expect(res.body.usuario.passwordHash).toBeUndefined();

    const usuarioGuardado = db.findAll('usuarios').find(u => u.email === email);
    expect(usuarioGuardado).toBeDefined();
    expect(usuarioGuardado.passwordHash).toBeDefined();
    expect(usuarioGuardado.passwordHash).not.toBe(password);
    expect(bcrypt.compareSync(password, usuarioGuardado.passwordHash)).toBe(true);
  });

  test('Registro sin apellido devuelve 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'Lucia', email: 'lucia@test.com', password: 'claveSegura123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  // test() o it() definen un caso de prueba individual
  test('Login correcto devuelve 200 y token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@dds.com', password: 'admin123' });

    // expect(valor).toBe(esperado) verifica que el valor sea exactamente el esperado
    expect(res.status).toBe(200);
    // expect(valor).toBeDefined() verifica que no sea undefined
    expect(res.body.token).toBeDefined();
    expect(res.body.usuario.rol).toBe('admin');
    expect(res.body.usuario.email).toBeUndefined();

    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(decoded).toMatchObject({ id: 1, nombre: 'Admin Sistema', rol: 'admin' });
    expect(decoded.email).toBeUndefined();
    expect(decoded.passwordHash).toBeUndefined();
  });

  test('Login sin campos requeridos devuelve 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@dds.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('Login con contraseña incorrecta devuelve 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@dds.com', password: 'contraseña_incorrecta' });

    expect(res.status).toBe(401);
    // expect(valor).toBeDefined() junto con error en body
    expect(res.body.error).toBeDefined();
  });

  test('Login con email inexistente devuelve 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'noexiste@test.com', password: '123456' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });
});

// ============================================================
// TEST 2: Listado de turnos con y sin filtros
// ============================================================
describe('2. Listado de turnos', () => {

  test('Lista todos los turnos sin filtros (admin)', async () => {
    const res = await request(app)
      .get('/api/turnos')
      // .set() agrega headers — así enviamos el JWT
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    // El service devuelve { data: [...], pagination: {...} }
    expect(res.body.data).toBeInstanceOf(Array);
    // La semilla crea 12 turnos
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('Lista turnos filtrados por estado=confirmado', async () => {
    const res = await request(app)
      .get('/api/turnos?estado=confirmado')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    // Todos los turnos devueltos deben tener estado confirmado
    for (let i = 0; i < res.body.data.length; i++) {
      expect(res.body.data[i].estado).toBe('confirmado');
    }
  });

  test('Lista turnos filtrados por fecha, tutor y especialidad', async () => {
    const res = await request(app)
      .get('/api/turnos?fecha=2026-06-10&tutorId=1&especialidad=backend')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    for (let i = 0; i < res.body.data.length; i++) {
      expect(res.body.data[i].fecha).toBe('2026-06-10');
      expect(res.body.data[i].tutorId).toBe(1);
      expect(res.body.data[i].tutorEspecialidad).toBe('backend');
    }
  });

  test('Lista turnos filtrados por modalidad', async () => {
    const res = await request(app)
      .get('/api/turnos?modalidad=presencial')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    for (let i = 0; i < res.body.data.length; i++) {
      expect(res.body.data[i].modalidad).toBe('presencial');
    }
  });

  test('Lista turnos con paginacion y ordenamiento', async () => {
    const res = await request(app)
      .get('/api/turnos?page=2&limit=3&sortBy=horaInicio&order=desc')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeLessThanOrEqual(3);
    expect(res.body.pagination).toMatchObject({ page: 2, limit: 3, total: 12, totalPages: 4 });

    for (let i = 1; i < res.body.data.length; i++) {
      expect(res.body.data[i - 1].horaInicio >= res.body.data[i].horaInicio).toBe(true);
    }
  });
});

// ============================================================
// TEST 3: Detalle de turno existente e inexistente
// ============================================================
describe('3. Detalle de turno', () => {

  test('Turno existente (id=1) devuelve 200', async () => {
    const res = await request(app)
      .get('/api/turnos/1')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
    // toHaveProperty verifica que el objeto tenga una propiedad
    expect(res.body).toHaveProperty('tutorId');
    expect(res.body).toHaveProperty('estado');
  });

  test('Turno inexistente devuelve 404', async () => {
    const res = await request(app)
      .get('/api/turnos/9999')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

// ============================================================
// TEST 4: Creación válida de un turno
// ============================================================
describe('4. Creación de turno válido', () => {

  test('Estudiante crea turno válido → 201', async () => {
    const res = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${tokenEstudiante}`)
      .send({
        tutorId: 3,           // Ana Martínez (testing)
        fecha: '2026-06-15',  // Lunes — Ana atiende lunes, miércoles
        horaInicio: '12:00',
        horaFin: '12:30',
        tema: 'Test de API con Supertest',
        modalidad: 'virtual'
      });

    expect(res.status).toBe(201);
    expect(res.body.estado).toBe('solicitado');
    expect(res.body.tutorId).toBe(3);

    const historial = await request(app)
      .get(`/api/turnos/${res.body.id}/historial`)
      .set('Authorization', `Bearer ${tokenEstudiante}`);

    expect(historial.status).toBe(200);
    expect(historial.body[0].accion).toBe('creacion');
    expect(historial.body[0]).toHaveProperty('turnoId', res.body.id);
    expect(historial.body[0]).toHaveProperty('usuarioId');
    expect(historial.body[0]).toHaveProperty('fechaHora');
  });

  test('Admin crea turno y el historial registra al admin como creador', async () => {
    const res = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        tutorId: 3,
        estudianteId: 8,
        fecha: '2026-06-15',
        horaInicio: '12:00',
        horaFin: '12:30',
        temas: ['Jest'],
        modalidad: 'virtual'
      });

    expect(res.status).toBe(201);

    const historial = await request(app)
      .get(`/api/turnos/${res.body.id}/historial`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(historial.status).toBe(200);
    expect(historial.body[0].accion).toBe('creacion');
    expect(historial.body[0].usuarioId).toBe(1);
    expect(historial.body[0].usuarioNombre).toBe('Admin Sistema');
  });

  test('Estudiante crea turno con categoria, multiples temas y observaciones', async () => {
    const res = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${tokenEstudiante}`)
      .send({
        tutorId: 1,
        fecha: '2026-06-15',
        horaInicio: '11:30',
        horaFin: '12:00',
        categoria: 'Backend',
        temas: ['JWT', 'Middlewares'],
        modalidad: 'virtual',
        observaciones: 'Necesito repasar autenticacion y middleware de token'
      });

    expect(res.status).toBe(201);
    expect(res.body.categoria).toBe('Backend');
    expect(res.body.temas).toEqual(['JWT', 'Middlewares']);
    expect(res.body.tema).toBe('JWT, Middlewares');
    expect(res.body.observaciones).toBe('Necesito repasar autenticacion y middleware de token');
  });
});

// ============================================================
// TEST 5: Creación inválida — horaInicio >= horaFin
// ============================================================
describe('5. Creación inválida por horario inconsistente', () => {

  test('horaInicio >= horaFin devuelve 400', async () => {
    const res = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${tokenEstudiante}`)
      .send({
        tutorId: 2,
        fecha: '2026-06-17',
        horaInicio: '11:00',
        horaFin: '10:00',  // horaFin MENOR que horaInicio — inválido
        tema: 'Test horario inválido',
        modalidad: 'presencial'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('horaInicio = horaFin devuelve 400', async () => {
    const res = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${tokenEstudiante}`)
      .send({
        tutorId: 2,
        fecha: '2026-06-17',
        horaInicio: '10:00',
        horaFin: '10:00',  // Igual — turno de 0 minutos
        tema: 'Test igual',
        modalidad: 'presencial'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});

// ============================================================
// TEST 6: Creación inválida — superposición horaria
// Semilla: turno1 = Marina, 2026-06-10, 09:00-09:30 (estado: solicitado)
// Este test pide Marina en la misma fecha con franja que se superpone
// ============================================================
describe('6. Creación inválida por superposición', () => {

  test('Turno superpuesto con Marina el 2026-06-10 → 400', async () => {
    const res = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${tokenEstudiante}`)
      .send({
        tutorId: 1,           // Marina López
        fecha: '2026-06-10',  // Miércoles — Marina atiende lunes, miércoles, viernes
        horaInicio: '09:15',  // Se superpone con 09:00-09:30
        horaFin: '09:45',
        tema: 'Test superposición',
        modalidad: 'virtual'
      });

    expect(res.status).toBe(400);
    // El mensaje de error debe mencionar superposición
    expect(res.body.error).toBeDefined();
  });

  test('Turno superpuesto para el mismo estudiante devuelve 400', async () => {
    db.insert('turnos', {
      tutorId: 1,
      estudianteId: 7,
      fecha: '2026-06-19',
      horaInicio: '10:00',
      horaFin: '10:30',
      tema: 'Turno previo del estudiante',
      modalidad: 'virtual',
      estado: 'solicitado',
      observaciones: null
    });

    const res = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        tutorId: 5,
        estudianteId: 7,
        fecha: '2026-06-19',
        horaInicio: '10:15',
        horaFin: '10:45',
        tema: 'Test estudiante ocupado',
        modalidad: 'virtual'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('estudiante');
  });

  test('Permite turno cuando uno termina exactamente cuando empieza el otro', async () => {
    db.insert('turnos', {
      tutorId: 1,
      estudianteId: 8,
      fecha: '2026-06-15',
      horaInicio: '10:30',
      horaFin: '11:00',
      tema: 'Turno previo',
      modalidad: 'virtual',
      estado: 'solicitado',
      observaciones: null
    });

    const res = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${tokenEstudiante}`)
      .send({
        tutorId: 1,
        fecha: '2026-06-15',
        horaInicio: '11:00',
        horaFin: '11:30',
        tema: 'Turno pegado sin superposicion',
        modalidad: 'virtual'
      });

    expect(res.status).toBe(201);
    expect(res.body.horaInicio).toBe('11:00');
    expect(res.body.estado).toBe('solicitado');
  });
});

// ============================================================
// TEST 7: Acceso sin JWT a ruta protegida → 401
// ============================================================
describe('7. Acceso sin token', () => {

  test('GET /api/turnos sin token → 401', async () => {
    const res = await request(app)
      .get('/api/turnos');
    // Sin el header Authorization, debe devolver 401

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  test('POST /api/turnos sin token → 401', async () => {
    const res = await request(app)
      .post('/api/turnos')
      .send({ tutorId: 1, fecha: '2026-06-15' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  test('GET /api/tutores sin token → 401', async () => {
    const res = await request(app)
      .get('/api/tutores');

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });
});

// ============================================================
// TEST 8: Token de estudiante en ruta solo para tutor/admin → 403
// ============================================================
describe('8. Acceso con rol insuficiente', () => {

  test('Estudiante intenta confirmar turno → 403', async () => {
    const res = await request(app)
      .patch('/api/turnos/1/confirmar')
      .set('Authorization', `Bearer ${tokenEstudiante}`);
    // El middleware autorizar('tutor', 'admin') debe rechazarlo con 403

    expect(res.status).toBe(403);
    expect(res.body.error).toBeDefined();
  });

  test('Tutor no puede cancelar turnos', async () => {
    const res = await request(app)
      .patch('/api/turnos/1/cancelar')
      .set('Authorization', `Bearer ${tokenTutor}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBeDefined();
  });

  test('Tutor no puede editar turnos', async () => {
    const res = await request(app)
      .put('/api/turnos/1')
      .set('Authorization', `Bearer ${tokenTutor}`)
      .send({
        fecha: '2026-06-15',
        horaInicio: '09:30',
        horaFin: '10:00',
        tema: 'Intento de edicion',
        modalidad: 'virtual'
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toBeDefined();
  });

  test('Estudiante puede cancelar su turno solicitado', async () => {
    const res = await request(app)
      .patch('/api/turnos/1/cancelar')
      .set('Authorization', `Bearer ${tokenEstudiante}`);

    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('cancelado');
  });

  test('Estudiante puede cancelar su turno confirmado', async () => {
    const res = await request(app)
      .patch('/api/turnos/4/cancelar')
      .set('Authorization', `Bearer ${tokenEstudiante}`);

    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('cancelado');
  });

  test('Admin puede cancelar cualquier turno solicitado o confirmado', async () => {
    const res = await request(app)
      .patch('/api/turnos/2/cancelar')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('cancelado');
  });

  test('Admin puede confirmar solicitado y realizar confirmado', async () => {
    const confirmado = await request(app)
      .patch('/api/turnos/1/confirmar')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(confirmado.status).toBe(200);
    expect(confirmado.body.estado).toBe('confirmado');

    const realizado = await request(app)
      .patch('/api/turnos/1/realizar')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ observaciones: 'Tutoria completada' });

    expect(realizado.status).toBe(200);
    expect(realizado.body.estado).toBe('realizado');
    expect(realizado.body.observaciones).toBe('Tutoria completada');
  });

  test('No permite saltar de solicitado a realizado', async () => {
    const res = await request(app)
      .patch('/api/turnos/1/realizar')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('confirmado');
  });

  test('No permite marcar realizado antes del horario de finalización', async () => {
    const turnoFuturo = db.insert('turnos', {
      tutorId: 1,
      estudianteId: 7,
      fecha: '2026-12-30',
      horaInicio: '10:00',
      horaFin: '10:30',
      tema: 'Servicios',
      modalidad: 'virtual',
      estado: 'confirmado',
      observaciones: null
    });

    const res = await request(app)
      .patch(`/api/turnos/${turnoFuturo.id}/realizar`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ observaciones: 'Intento anticipado' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('antes del horario');
  });

  test('No permite confirmar un turno ya confirmado', async () => {
    const res = await request(app)
      .patch('/api/turnos/4/confirmar')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('solicitado');
  });
});

// ============================================================
// TEST 9: Edición inválida — reasignar a tutor ocupado
// Semilla: turno4 = Carlos, 2026-06-11, 10:00-10:30 (estado: confirmado)
// Intentamos editar turno1 (Marina, 2026-06-10) reasignándolo a Carlos
// en un horario que se superpone con el turno4 de Carlos
// ============================================================
describe('9. Edición inválida — tutor ocupado', () => {

  test('Reasignar turno1 a Carlos con franja superpuesta → 400', async () => {
    const res = await request(app)
      .put('/api/turnos/1')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        tutorId: 2,           // Carlos Gómez
        fecha: '2026-06-11',  // Jueves — Carlos tiene turno de 10:00-10:30
        horaInicio: '10:15',  // Se superpone con 10:00-10:30
        horaFin: '10:45',
        tema: 'Test edición conflicto',
        modalidad: 'virtual'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('Reasignar turno1 a otro tutor genera acción de reasignación cuando la edición es válida', async () => {
    const res = await request(app)
      .put('/api/turnos/1')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        tutorId: 3,
        fecha: '2026-06-17',
        horaInicio: '12:00',
        horaFin: '12:30',
        tema: 'Test reasignación',
        modalidad: 'virtual'
      });

    expect(res.status).toBe(200);
    expect(res.body.tutorId).toBe(3);

    const historial = await request(app)
      .get('/api/turnos/1/historial')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(historial.status).toBe(200);
    expect(historial.body[historial.body.length - 1].accion).toBe('reasignacion');
    expect(historial.body[historial.body.length - 1].valorAnterior).toContain('"tutorId":1');
    expect(historial.body[historial.body.length - 1].valorNuevo).toContain('"tutorId":3');
  });

  test('Turno realizado solo permite editar observaciones', async () => {
    const edicionInvalida = await request(app)
      .put('/api/turnos/7')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        tema: 'Cambio no permitido',
        observaciones: 'Intento de cambio'
      });

    expect(edicionInvalida.status).toBe(400);
    expect(edicionInvalida.body.error).toContain('observaciones');

    const edicionValida = await request(app)
      .put('/api/turnos/7')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        observaciones: 'Observacion actualizada'
      });

    expect(edicionValida.status).toBe(200);
    expect(edicionValida.body.estado).toBe('realizado');
    expect(edicionValida.body.observaciones).toBe('Observacion actualizada');

    const historial = await request(app)
      .get('/api/turnos/7/historial')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(historial.status).toBe(200);
    expect(historial.body[historial.body.length - 1].accion).toBe('edicion');
    expect(historial.body[historial.body.length - 1].valorNuevo).toContain('Observacion actualizada');
  });
});

// ============================================================
// TEST 10: Día no disponible para el tutor
// Marina atiende: lunes, miércoles, viernes
// 2026-06-09 es MARTES → no disponible
// ============================================================
describe('10. Día no disponible para el tutor', () => {

  test('Marina no atiende martes (2026-06-09) → 400', async () => {
    const res = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${tokenEstudiante}`)
      .send({
        tutorId: 1,           // Marina López
        fecha: '2026-06-09',  // Martes — Marina NO atiende martes
        horaInicio: '10:00',
        horaFin: '10:30',
        tema: 'Test día no disponible',
        modalidad: 'virtual'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('Horario fuera de la disponibilidad del tutor devuelve 400', async () => {
    const res = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${tokenEstudiante}`)
      .send({
        tutorId: 1,
        fecha: '2026-06-15',
        horaInicio: '13:00',
        horaFin: '13:30',
        tema: 'Test fuera de horario',
        modalidad: 'virtual'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('atiende de 09:00 a 12:30');
  });

  test('Tutor inactivo no puede recibir turnos', async () => {
    db.update('tutores', 1, { activo: false });

    const res = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${tokenEstudiante}`)
      .send({
        tutorId: 1,
        fecha: '2026-06-15',
        horaInicio: '10:00',
        horaFin: '10:30',
        tema: 'Test tutor inactivo',
        modalidad: 'virtual'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('inactivo');
  });

  test('No permite crear turnos en fechas anteriores a hoy', async () => {
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const fechaAyer = `${ayer.getFullYear()}-${String(ayer.getMonth() + 1).padStart(2, '0')}-${String(ayer.getDate()).padStart(2, '0')}`;

    const res = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${tokenEstudiante}`)
      .send({
        tutorId: 1,
        fecha: fechaAyer,
        horaInicio: '10:00',
        horaFin: '10:30',
        tema: 'Test fecha pasada',
        modalidad: 'virtual'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('fechas anteriores');
  });

  test('No permite crear turnos en años anteriores o posteriores al actual', async () => {
    const anioActual = new Date().getFullYear();

    const resAnioAnterior = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${tokenEstudiante}`)
      .send({
        tutorId: 1,
        fecha: `${anioActual - 1}-06-16`,
        horaInicio: '10:00',
        horaFin: '10:30',
        tema: 'Test año anterior',
        modalidad: 'virtual'
      });

    expect(resAnioAnterior.status).toBe(400);
    expect(resAnioAnterior.body.error).toContain(`año ${anioActual}`);

    const resAnioPosterior = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${tokenEstudiante}`)
      .send({
        tutorId: 1,
        fecha: `${anioActual + 1}-06-16`,
        horaInicio: '10:00',
        horaFin: '10:30',
        tema: 'Test año posterior',
        modalidad: 'virtual'
      });

    expect(resAnioPosterior.status).toBe(400);
    expect(resAnioPosterior.body.error).toContain(`año ${anioActual}`);
  });
});

// ============================================================
// TEST 11: Historial de cambios
// ============================================================
describe('11. Historial de cambios', () => {
  function esperarEntradaValida(entrada, accion) {
    expect(entrada).toHaveProperty('turnoId');
    expect(entrada).toHaveProperty('usuarioId');
    expect(entrada).toHaveProperty('accion', accion);
    expect(entrada).toHaveProperty('fechaHora');
    expect(entrada).toHaveProperty('valorAnterior');
    expect(entrada).toHaveProperty('valorNuevo');
  }

  test('Registra creacion, edicion, confirmacion, cancelacion, realizacion y reasignacion', async () => {
    const creado = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${tokenEstudiante}`)
      .send({
        tutorId: 3,
        fecha: '2026-06-17',
        horaInicio: '12:00',
        horaFin: '12:30',
        tema: 'Historial creacion',
        modalidad: 'virtual'
      });

    expect(creado.status).toBe(201);
    let historial = await request(app)
      .get(`/api/turnos/${creado.body.id}/historial`)
      .set('Authorization', `Bearer ${tokenEstudiante}`);

    expect(historial.status).toBe(200);
    esperarEntradaValida(historial.body[historial.body.length - 1], 'creacion');

    const editado = await request(app)
      .put('/api/turnos/1')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        fecha: '2026-06-15',
        horaInicio: '11:30',
        horaFin: '12:00',
        tema: 'Historial edicion',
        modalidad: 'virtual'
      });

    expect(editado.status).toBe(200);
    historial = await request(app)
      .get('/api/turnos/1/historial')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    esperarEntradaValida(historial.body[historial.body.length - 1], 'edicion');

    const confirmado = await request(app)
      .patch('/api/turnos/1/confirmar')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(confirmado.status).toBe(200);
    historial = await request(app)
      .get('/api/turnos/1/historial')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    esperarEntradaValida(historial.body[historial.body.length - 1], 'confirmacion');

    const realizado = await request(app)
      .patch('/api/turnos/4/realizar')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ observaciones: 'Historial realizacion' });

    expect(realizado.status).toBe(200);
    historial = await request(app)
      .get('/api/turnos/4/historial')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    esperarEntradaValida(historial.body[historial.body.length - 1], 'realizacion');

    const cancelado = await request(app)
      .patch('/api/turnos/2/cancelar')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(cancelado.status).toBe(200);
    historial = await request(app)
      .get('/api/turnos/2/historial')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    esperarEntradaValida(historial.body[historial.body.length - 1], 'cancelacion');

    const reasignado = await request(app)
      .put('/api/turnos/3')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        tutorId: 3,
        fecha: '2026-06-17',
        horaInicio: '08:30',
        horaFin: '09:00',
        tema: 'Historial reasignacion',
        modalidad: 'virtual'
      });

    expect(reasignado.status).toBe(200);
    historial = await request(app)
      .get('/api/turnos/3/historial')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    esperarEntradaValida(historial.body[historial.body.length - 1], 'reasignacion');
  });

  test('Turno existente sin historial guardado devuelve historial informativo', async () => {
    const historial = await request(app)
      .get('/api/turnos/9/historial')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(historial.status).toBe(200);
    expect(historial.body).toBeInstanceOf(Array);
    expect(historial.body.length).toBeGreaterThanOrEqual(3);
    expect(historial.body.map(e => e.accion)).toEqual(expect.arrayContaining(['creacion', 'confirmacion', 'realizacion']));
    expect(historial.body[0]).toHaveProperty('usuarioNombre');
  });
});

// ============================================================
// TEST 12: Resumen admin bloqueado para otros roles
// ============================================================
describe('12. Resumen admin protegido', () => {
  test('Estudiante no puede acceder al resumen → 403', async () => {
    const res = await request(app)
      .get('/api/turnos/resumen')
      .set('Authorization', `Bearer ${tokenEstudiante}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBeDefined();
  });

  test('Admin accede al resumen con totalTurnos', async () => {
    const res = await request(app)
      .get('/api/turnos/resumen')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.totalTurnos).toBeDefined();
    expect(res.body.turnosHoy).toBeDefined();
    expect(res.body.turnosPorTutor).toBeInstanceOf(Array);
    expect(res.body.temasMasSolicitados).toBeInstanceOf(Array);
    expect(res.body.temasPorCategoria).toBeInstanceOf(Array);
    expect(res.body.temasPorCategoria[0]).toHaveProperty('categoria');
    expect(res.body.temasPorCategoria[0]).toHaveProperty('temas');
    expect(res.body.temasPorEspecialidad).toBeInstanceOf(Array);
    expect(res.body.temasPorEspecialidad[0]).toHaveProperty('especialidad');
    expect(res.body.temasPorEspecialidad[0]).toHaveProperty('temas');
  });
});
