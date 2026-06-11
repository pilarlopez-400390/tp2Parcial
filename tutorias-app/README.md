# Sistema de Tutorias

Aplicacion full stack para gestionar turnos de tutorias con autenticacion JWT, roles, historial, disponibilidad horaria, filtros, paginacion, panel administrativo y tests automatizados.

## Tecnologias

- Backend: Node.js, Express, JWT, bcryptjs, persistencia en JSON.
- Frontend: React, React Router, Axios, Vite.
- Testing backend: Jest + Supertest.

## Como Ejecutar

### Backend

```bash
cd backend
npm install
npm run seed
npm run dev
```

El backend corre en `http://localhost:3001`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend corre en `http://localhost:5173`.

Vite usa proxy: las llamadas a `/api` se redirigen a `http://localhost:3001/api`.

## Credenciales de Prueba

Admin:

- Email: `admin@dds.com`
- Password: `admin123`

Tutor:

- Email: `marina@dds.com`
- Password: `tutor123`

Estudiante:

- Email: `valen@dds.com`
- Password: `estudiante123`

## Endpoints Backend

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`

Tutores:

- `GET /api/tutores`
- `GET /api/tutores/:id`
- `GET /api/tutores/:id/agenda?fecha=YYYY-MM-DD`

Turnos:

- `GET /api/turnos`
- `GET /api/turnos/resumen`
- `GET /api/turnos/:id`
- `GET /api/turnos/:id/historial`
- `POST /api/turnos`
- `PUT /api/turnos/:id`
- `PATCH /api/turnos/:id/cancelar`
- `PATCH /api/turnos/:id/confirmar`
- `PATCH /api/turnos/:id/realizar`

Usuarios admin:

- `GET /api/usuarios`
- `POST /api/usuarios`
- `PATCH /api/usuarios/:id`
- `DELETE /api/usuarios/:id`

## Rutas Frontend

- `/login`: inicio de sesion.
- `/register`: registro de estudiante.
- `/turnos`: listado con filtros y paginacion.
- `/turnos/nuevo`: alta de turno.
- `/turnos/:id`: detalle e historial.
- `/turnos/:id/editar`: edicion de turno, solo admin.
- `/resumen`: panel administrativo, solo admin.
- `/admin/usuarios`: administracion de usuarios, solo admin.
- `*`: pagina 404.

## JWT

El login correcto devuelve un token JWT y los datos del usuario. El frontend guarda token y usuario en `localStorage` mediante `AuthContext`.

Axios agrega automaticamente:

```http
Authorization: Bearer <token>
```

Las rutas protegidas usan middleware JWT en backend y `PrivateRoute` en frontend.

## Roles y Permisos

Estudiante:

- Puede registrarse, iniciar sesion, crear turnos, ver sus turnos, ver detalle e historial de sus turnos y cancelar turnos solicitados o confirmados propios.
- No puede confirmar, realizar, reasignar tutor ni administrar turnos ajenos.

Tutor:

- Puede iniciar sesion, ver turnos asignados, ver detalle, confirmar turnos asignados y marcar realizados sus turnos.
- No puede cancelar, editar, reasignar tutor ni administrar turnos ajenos.

Admin:

- Puede ver todos los turnos, ver detalles, confirmar, cancelar, marcar realizados, editar, reasignar tutor, administrar usuarios y ver panel resumen.

## Reglas de Turnos

Estados:

```text
solicitado -> confirmado o cancelado
confirmado -> realizado o cancelado
realizado -> solo permite editar observaciones
```

Crear turno valida:

- Tutor existente.
- Tutor activo.
- Fecha no pasada y dentro del anio actual.
- `horaInicio < horaFin`.
- Categoria de consulta: Backend, Frontend, Testing o Seguridad.
- Uno o mas subtemas seleccionados con checkboxes.
- Observaciones opcionales para detallar la consulta.
- Dia disponible del tutor.
- Horario dentro de la disponibilidad del tutor.
- Sin superposicion de tutor.
- Sin superposicion de estudiante.

Editar o reasignar tutor vuelve a validar disponibilidad y superposicion.

## Categorias y Temas

Los turnos guardan:

- `categoria`: Backend, Frontend, Testing o Seguridad.
- `temas`: lista de subtemas seleccionados.
- `tema`: resumen de compatibilidad, por ejemplo `JWT, Middlewares`.
- `observaciones`: texto libre opcional.

Esto permite mostrar el detalle completo del turno y calcular estadisticas por categoria y subtema en el panel administrativo.

## Disponibilidad

Cada tutor tiene:

- `diasDisponibles`: por ejemplo `['lunes', 'miercoles', 'viernes']`.
- `horarioDisponible`: por ejemplo `{ "inicio": "09:00", "fin": "12:30" }`.
- `activo`: si esta en `false`, no puede recibir turnos.

El frontend muestra tarjetas de tutores con especialidad, dias y horarios, y limita la seleccion de fechas/horas. El backend es la fuente de verdad y vuelve a validar todo.

## Superposicion

Un turno bloquea disponibilidad si:

- Tiene el mismo tutor o el mismo estudiante.
- Tiene la misma fecha.
- Esta en estado `solicitado` o `confirmado`.
- Su horario se superpone.

Si un turno termina exactamente cuando empieza otro, se permite. Ejemplo:

- `10:30-11:00`
- `11:00-11:30`

No hay superposicion.

## Historial

Cada cambio registra:

- `turnoId`
- `usuarioId`
- `accion`
- `fechaHora`
- `valorAnterior`
- `valorNuevo`

Acciones registradas:

- `creacion`
- `edicion`
- `confirmacion`
- `cancelacion`
- `realizacion`
- `reasignacion`

El historial se ve en `/turnos/:id` con el boton "Ver historial de cambios".

## Filtros, Paginacion y Ordenamiento

`GET /api/turnos` acepta:

- `fecha`
- `estado`
- `tutorId`
- `especialidad`
- `estudianteId`
- `page`
- `limit`
- `sortBy`
- `order`

Ejemplo:

```http
GET /api/turnos?estado=confirmado&page=1&limit=10&sortBy=fecha&order=asc
```

## Panel Administrativo

Disponible solo para admin en `/resumen`.

Muestra:

- Turnos del dia.
- Turnos pendientes de confirmacion.
- Total de turnos.
- Turnos por tutor.
- Temas mas solicitados por categoria.
- Detalle interactivo de turnos.

## Persistencia

Se usan archivos JSON en:

- `backend/data/usuarios.json`
- `backend/data/tutores.json`
- `backend/data/turnos.json`
- `backend/data/historial_turnos.json`

Los tests usan `backend/data-test` para no contaminar los datos reales.

## Datos Semilla

El seed carga como minimo:

- 1 admin.
- 5 tutores.
- 3 estudiantes.
- 12 turnos.
- Historial inicial.

Para regenerarlos:

```bash
cd backend
npm run seed
```

## Testing

```bash
cd backend
npm test
```

La suite prueba:

- Login correcto.
- Login incorrecto.
- Listado sin filtros.
- Listado con filtros.
- Paginacion y ordenamiento.
- Detalle existente.
- Detalle inexistente.
- Crear turno valido.
- Crear turno con horario invalido.
- Crear turno con superposicion.
- Crear turno en dia no disponible.
- Acceso sin JWT.
- Acceso con rol insuficiente.
- Editar reasignando tutor ocupado.
- Flujo de estados.
- Tutor inactivo.
- Fechas no permitidas.
- Historial completo.
- Panel admin protegido.

## Limitaciones Conocidas

- Persistencia en JSON: sirve para el trabajo practico, pero no es adecuada para concurrencia real en produccion.
- El frontend usa estilos inline y CSS simple, no un sistema de componentes.
- El proxy `/api` de Vite funciona en desarrollo; en produccion se debe configurar el servidor que sirva frontend y backend.
- Las fechas se validan contra la fecha local del servidor.

## Checklist Rapido

- Registro: OK
- Login: OK
- JWT: OK
- Roles: OK
- CRUD de turnos: OK
- Flujo de estados: OK
- Disponibilidad: OK
- Superposicion: OK
- Historial: OK
- Filtros: OK
- Paginacion: OK
- Ordenamiento: OK
- Panel admin: OK
- Datos semilla: OK
- Backend protegido: OK
- Frontend protegido: OK
- Tests: OK
- README: OK
