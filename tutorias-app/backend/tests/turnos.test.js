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
const app = require('../app');
const seed = require('../src/seed/seed');
const db = require('../src/config/database');

// Variables para reutilizar tokens entre tests
let tokenAdmin;
let tokenEstudiante;
let tokenTutor;

// beforeAll: se ejecuta UNA vez antes de todos los tests
// Cargamos los datos semilla en data-test/ para tener datos predecibles
beforeAll(async () => {
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
        horaInicio: '14:00',
        horaFin: '14:30',
        tema: 'Test de API con Supertest',
        modalidad: 'virtual'
      });

    expect(res.status).toBe(201);
    expect(res.body.estado).toBe('solicitado');
    expect(res.body.tutorId).toBe(3);
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
});
