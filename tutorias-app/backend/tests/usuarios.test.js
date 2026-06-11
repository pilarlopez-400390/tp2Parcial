process.env.NODE_ENV = 'test';
require('dotenv').config();

const request = require('supertest');
const app = require('../app');
const seed = require('../src/seed/seed');
const db = require('../src/config/database');

let tokenAdmin;
let createdUsuarioId;

describe('Usuarios API - admin JWT', () => {
  beforeAll(async () => {
    db.clear('usuarios');
    db.clear('tutores');
    db.clear('turnos');
    db.clear('historial_turnos');
    seed();

    const resAdmin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@dds.com', password: 'admin123' });

    tokenAdmin = resAdmin.body.token;
  });

  afterAll(() => {
    db.clear('usuarios');
    db.clear('tutores');
    db.clear('turnos');
    db.clear('historial_turnos');
  });

  test('Admin puede listar usuarios con JWT válido', async () => {
    const res = await request(app)
      .get('/api/usuarios')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.some(u => u.email === 'admin@dds.com')).toBe(true);
  });

  test('Admin puede crear un tutor nuevo', async () => {
    const res = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        nombre: 'Tutor Prueba',
        email: 'tutor.prueba@dds.com',
        password: 'tutorPrueba123',
        rol: 'tutor',
        especialidad: 'bases de datos',
        diasDisponibles: 'lunes,martes',
        horarioDisponible: { inicio: '13:00', fin: '18:00' }
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.rol).toBe('tutor');

    const tutorCreado = db.findAll('tutores').find(t => t.usuarioId === res.body.id);
    expect(tutorCreado).toBeDefined();
    expect(tutorCreado.especialidad).toBe('bases de datos');
    expect(tutorCreado.diasDisponibles).toEqual(['lunes', 'martes']);
    expect(tutorCreado.horarioDisponible).toEqual({ inicio: '13:00', fin: '18:00' });

    createdUsuarioId = res.body.id;
  });

  test('Admin puede actualizar el estado activo de un usuario', async () => {
    if (!createdUsuarioId) {
      return fail('No se creó el usuario de prueba en el test anterior');
    }

    const res = await request(app)
      .patch(`/api/usuarios/${createdUsuarioId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ activo: false });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('activo', false);
  });
});
