# Sistema de Gestión de Tutorías — DDS 2026

**UTN FRC · Desarrollo de Software · 3K7 · Legajo 401655**

## Descripción

Aplicación full-stack para gestionar turnos de tutoría entre estudiantes y tutores. Permite solicitar, confirmar, cancelar y marcar como realizados los turnos, con control de acceso por roles (admin, tutor, estudiante).

## Tecnologías

**Backend:** Node.js · Express · bcryptjs · jsonwebtoken · Jest · Supertest  
**Frontend:** React 18 · Vite · React Router DOM · Axios  
**Persistencia:** archivos JSON (sin base de datos externa)

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
npm run seed     # Carga datos de prueba
npm run dev      # Inicia servidor en http://localhost:3001
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev      # Inicia app en http://localhost:5173
```

---

## Tests

```bash
cd backend
npm test
```

Resultado esperado: **16/16 tests pasando**

---

## Credenciales de prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@dds.com | admin123 |
| Tutor (Marina) | marina@dds.com | tutor123 |
| Tutor (Carlos) | carlos@dds.com | tutor123 |
| Estudiante | valen@dds.com | estudiante123 |

---

## Estructura del proyecto

```
tutorias-app/
├── backend/
│   ├── .env                        ← Variables de entorno (PORT, JWT_SECRET)
│   ├── package.json
│   ├── server.js                   ← Punto de entrada del servidor HTTP
│   ├── app.js                      ← Configuración de Express
│   ├── data/                       ← Archivos JSON de producción
│   ├── data-test/                  ← Archivos JSON de test
│   ├── tests/
│   │   └── turnos.test.js          ← 10 suites de tests
│   └── src/
│       ├── config/
│       │   └── database.js         ← API de persistencia JSON
│       ├── seed/
│       │   └── seed.js             ← Datos de prueba
│       ├── middlewares/
│       │   ├── auth.middleware.js       ← Verifica JWT
│       │   ├── authorize.middleware.js  ← Verifica roles
│       │   └── errorHandler.middleware.js
│       ├── services/
│       │   ├── auth.service.js     ← Lógica de registro/login
│       │   ├── tutores.service.js  ← Lógica de tutores
│       │   └── turnos.service.js   ← Lógica de turnos (máquina de estados)
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── tutores.controller.js
│       │   └── turnos.controller.js
│       └── routes/
│           ├── auth.routes.js
│           ├── tutores.routes.js
│           └── turnos.routes.js
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx                 ← Router principal
        ├── context/
        │   └── AuthContext.jsx     ← Estado global de autenticación
        ├── services/
        │   ├── api.js              ← Instancia Axios con interceptores
        │   ├── authService.js
        │   ├── tutoresService.js
        │   └── turnosService.js
        ├── components/
        │   ├── Navbar.jsx
        │   └── PrivateRoute.jsx    ← Protege rutas del frontend
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── TurnosList.jsx      ← Lista con filtros y paginación
            ├── TurnoDetalle.jsx    ← Detalle con acciones y historial
            ├── TurnoForm.jsx       ← Formulario crear/editar
            ├── ResumenAdmin.jsx    ← Panel de estadísticas
            └── NotFound.jsx        ← Página 404
```

---

## API REST

| Método | Ruta | Auth | Roles |
|--------|------|------|-------|
| POST | /api/auth/register | No | — |
| POST | /api/auth/login | No | — |
| GET | /api/tutores | No | — |
| GET | /api/tutores/:id | No | — |
| GET | /api/turnos | Sí | todos |
| GET | /api/turnos/resumen | Sí | admin |
| GET | /api/turnos/:id | Sí | todos |
| GET | /api/turnos/:id/historial | Sí | todos |
| POST | /api/turnos | Sí | estudiante, admin |
| PUT | /api/turnos/:id | Sí | todos |
| PATCH | /api/turnos/:id/cancelar | Sí | todos |
| PATCH | /api/turnos/:id/confirmar | Sí | tutor, admin |
| PATCH | /api/turnos/:id/realizar | Sí | tutor, admin |

---

## Máquina de estados de los turnos

```
solicitado ──→ confirmado ──→ realizado
     │               │
     └───────────────┴──→ cancelado
```

- **solicitado → confirmado:** tutor asignado o admin
- **solicitado/confirmado → cancelado:** cualquier rol
- **confirmado → realizado:** tutor asignado o admin
- **realizado/cancelado:** sin más transiciones posibles

---

## Reglas de negocio

1. El tutor debe estar **activo**
2. La fecha debe caer en un **día disponible** del tutor
3. No puede haber **superposición horaria** con otro turno del mismo tutor
4. `horaInicio` debe ser **estrictamente menor** que `horaFin`
5. Los estudiantes solo ven **sus propios turnos**
6. Los tutores solo ven **sus turnos asignados**
7. Los admins ven **todos los turnos**
