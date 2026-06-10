# Sistema de Gestión de Tutorías — DDS 2026

**UTN FRC · Desarrollo de Software · 3K7 · Grupo 8**

Aplicación full-stack para gestionar turnos de tutoría entre estudiantes y tutores. Permite solicitar, confirmar, cancelar y marcar como realizados los turnos, con control de acceso por roles (admin, tutor, estudiante) y registro de historial de cambios.

---

## Tecnologías

| Capa | Stack |
|------|-------|
| Backend | Node.js · Express · bcryptjs · jsonwebtoken · dotenv |
| Frontend | React 18 · Vite · React Router DOM · Axios |
| Testing | Jest · Supertest |
| Persistencia | Archivos JSON (sin base de datos externa) |

---

## Instalación y ejecución

### 1. Clonar el proyecto

```bash
git clone <url-del-repo>
cd tutorias-app
```

### 2. Backend

```bash
cd backend
npm install
npm run seed     # Carga los datos de prueba (usuarios, tutores y turnos)
npm run dev      # Inicia el servidor en http://localhost:3001
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev      # Inicia la app en http://localhost:5173
```

> El frontend usa un proxy Vite que redirige `/api/*` al backend, por lo que no hace falta configurar CORS manualmente.

---

## Tests

```bash
cd backend
npm test
```

Resultado esperado: **16/16 tests pasando**

Los tests usan una carpeta `data-test/` separada de los datos de producción (`data/`), por lo que ejecutarlos no afecta los datos cargados con el seed.

---

## Credenciales de prueba

Luego de ejecutar `npm run seed`, están disponibles los siguientes usuarios:

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@dds.com | admin123 |
| Tutor (Marina — Backend) | marina@dds.com | tutor123 |
| Tutor (Carlos — Frontend) | carlos@dds.com | tutor123 |
| Tutor (Ana — Testing) | ana@dds.com | tutor123 |
| Tutor (Diego — Seguridad) | diego@dds.com | tutor123 |
| Tutor (Laura — Backend) | laura@dds.com | tutor123 |
| Estudiante (Valen) | valen@dds.com | estudiante123 |
| Estudiante (Tomás) | tomas@dds.com | estudiante123 |
| Estudiante (Sofía) | sofia@dds.com | estudiante123 |

---

## Estructura del proyecto

```
tutorias-app/
├── backend/
│   ├── .env                             ← Variables: PORT=3001, JWT_SECRET
│   ├── server.js                        ← Punto de entrada del servidor HTTP
│   ├── app.js                           ← Configuración de Express (middlewares, rutas)
│   ├── data/                            ← JSON de producción (usuarios, tutores, turnos, historial)
│   ├── data-test/                       ← JSON aislado usado durante los tests
│   ├── tests/
│   │   └── turnos.test.js               ← 16 tests con Jest + Supertest
│   └── src/
│       ├── config/
│       │   └── database.js              ← API de lectura/escritura sobre archivos JSON
│       ├── seed/
│       │   └── seed.js                  ← Genera usuarios, tutores y 12 turnos de prueba
│       ├── middlewares/
│       │   ├── auth.middleware.js        ← Verifica que el JWT sea válido
│       │   ├── authorize.middleware.js   ← Verifica que el rol tenga permiso
│       │   └── errorHandler.middleware.js ← Captura errores y responde con JSON
│       ├── services/
│       │   ├── auth.service.js           ← Registro y login (hash con bcryptjs)
│       │   ├── tutores.service.js        ← Listado y detalle de tutores activos
│       │   └── turnos.service.js         ← Toda la lógica: estados, disponibilidad, historial
│       ├── controllers/
│       │   ├── auth.controller.js        ← Maneja las rutas /api/auth/*
│       │   ├── tutores.controller.js     ← Maneja las rutas /api/tutores/*
│       │   └── turnos.controller.js      ← Maneja las rutas /api/turnos/*
│       └── routes/
│           ├── auth.routes.js
│           ├── tutores.routes.js
│           └── turnos.routes.js
│
└── frontend/
    ├── vite.config.js                   ← Proxy /api → localhost:3001
    └── src/
        ├── main.jsx                     ← Punto de entrada de React
        ├── App.jsx                      ← Router principal con rutas protegidas
        ├── context/
        │   └── AuthContext.jsx          ← Estado global: usuario, token, login/logout
        ├── services/
        │   ├── api.js                   ← Axios con interceptor JWT (y redirect al 401)
        │   ├── authService.js           ← Llama a /api/auth/register y /api/auth/login
        │   ├── tutoresService.js        ← Llama a /api/tutores
        │   └── turnosService.js         ← Llama a todos los endpoints de /api/turnos
        ├── components/
        │   ├── Navbar.jsx               ← Barra de navegación con botón de logout
        │   └── PrivateRoute.jsx         ← Redirige a /login si no hay sesión activa
        └── pages/
            ├── Login.jsx                ← Formulario de login
            ├── Register.jsx             ← Formulario de registro
            ├── TurnosList.jsx           ← Lista con filtros (estado, fecha) y paginación
            ├── TurnoDetalle.jsx         ← Detalle del turno con acciones e historial
            ├── TurnoForm.jsx            ← Formulario para crear o editar un turno
            ├── ResumenAdmin.jsx         ← Panel de estadísticas (solo admin)
            └── NotFound.jsx             ← Página 404
```

---

## API REST

### Rutas públicas (sin autenticación)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registra un nuevo usuario |
| POST | `/api/auth/login` | Inicia sesión, devuelve `{ token, usuario }` |
| GET | `/api/tutores` | Lista todos los tutores activos |
| GET | `/api/tutores/:id` | Detalle de un tutor específico |

### Rutas protegidas (requieren `Authorization: Bearer <token>`)

| Método | Ruta | Roles permitidos | Descripción |
|--------|------|------------------|-------------|
| GET | `/api/turnos` | todos | Lista turnos con filtros y paginación |
| GET | `/api/turnos/resumen` | admin | Estadísticas generales |
| GET | `/api/turnos/:id` | todos | Detalle de un turno |
| GET | `/api/turnos/:id/historial` | todos | Historial de cambios del turno |
| POST | `/api/turnos` | estudiante, admin | Crea un turno en estado `solicitado` |
| PUT | `/api/turnos/:id` | todos | Edita datos del turno |
| PATCH | `/api/turnos/:id/cancelar` | todos | Cancela el turno |
| PATCH | `/api/turnos/:id/confirmar` | tutor, admin | Confirma el turno |
| PATCH | `/api/turnos/:id/realizar` | tutor, admin | Marca el turno como realizado |

#### Filtros disponibles en `GET /api/turnos`

```
GET /api/turnos?estado=confirmado&fecha=2026-06-10&tutorId=abc123&especialidad=backend&page=1&limit=10
```

Todos los filtros son opcionales y combinables.

---

## Máquina de estados de los turnos

```
                  ┌─────────────┐
                  │  solicitado │
                  └──────┬──────┘
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
       ┌─────────────┐       ┌─────────────┐
       │  confirmado │       │  cancelado  │
       └──────┬──────┘       └─────────────┘
              │
    ┌─────────┴─────────┐
    ▼                   ▼
┌──────────┐     ┌─────────────┐
│ realizado│     │  cancelado  │
└──────────┘     └─────────────┘
```

| Transición | Quién puede ejecutarla |
|------------|------------------------|
| `solicitado → confirmado` | tutor asignado o admin |
| `solicitado → cancelado` | cualquier rol |
| `confirmado → realizado` | tutor asignado o admin |
| `confirmado → cancelado` | cualquier rol |
| `realizado / cancelado` | sin transiciones posibles |

---

## Reglas de negocio

### Disponibilidad de turnos

Para que un turno pueda crearse o editarse, deben cumplirse **las tres condiciones simultáneamente**:

1. El tutor debe estar **activo** (campo `activo: true` en la base de datos).
2. La fecha del turno debe caer en un **día disponible** del tutor (ej: `["lunes", "miercoles"]`).
3. No debe existir **superposición horaria** con otro turno del mismo tutor en el mismo día que esté en estado `solicitado` o `confirmado`. Los límites exactos no se consideran superposición (fin a las 11:00 y comienzo a las 11:00 están permitidos).

Adicionalmente, `horaInicio` debe ser **estrictamente menor** que `horaFin`.

### Visibilidad por rol

| Rol | ¿Qué turnos ve? |
|-----|-----------------|
| Estudiante | Solo sus propios turnos |
| Tutor | Solo los turnos donde está asignado |
| Admin | Todos los turnos |

### Historial de auditoría

Cada cambio de estado o edición de datos registra automáticamente una entrada en el historial del turno con:
- Fecha y hora del cambio
- ID del usuario que realizó la acción
- Acción realizada (`creacion`, `edicion`, `confirmacion`, `cancelacion`, `realizacion`)
- Valor anterior y nuevo (para ediciones)

---

## Autenticación

Se usa **JWT (JSON Web Token)** con expiración de 24 horas.

- El token se envía en el header `Authorization: Bearer <token>`.
- El frontend lo almacena en `localStorage` y lo inyecta automáticamente en cada petición via un interceptor de Axios.
- Si el backend devuelve un `401`, el interceptor limpia la sesión y redirige a `/login`.
- Las contraseñas se hashean con **bcryptjs** (10 rondas de sal) antes de guardarse.

---

## Panel administrativo (`/resumen`)

Accesible únicamente con el rol `admin`. Muestra:

- Cantidad de turnos del día actual
- Cantidad de turnos pendientes (estado `solicitado`)
- Total de turnos en el sistema
- Tabla de turnos agrupados por tutor
- Top 5 de temas más solicitados
