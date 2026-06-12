// src/pages/TurnoForm.jsx
// Sirve tanto para crear (POST) como para editar (PUT) un turno.

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import turnosService from '../services/turnosService'
import tutoresService from '../services/tutoresService'
import usuariosService from '../services/usuariosService'
import { useAuth } from '../context/AuthContext'

const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']

const CATEGORIAS_TEMAS = {
  Backend: [
    'Express Router', 'Rutas y endpoints', 'Controladores', 'Servicios', 'Middlewares',
    'JWT', 'Autenticación', 'Autorización', 'Validaciones', 'Manejo de errores',
    'Persistencia (JSON / SQLite)', 'CRUD', 'API REST', 'Axios (consumo de API)',
    'Filtros y paginación', 'Otro'
  ],
  Frontend: [
    'React', 'Componentes', 'React Router', 'Formularios', 'useState', 'useEffect',
    'Context API', 'Manejo de estado', 'Axios', 'Validaciones', 'Manejo de errores',
    'Diseño de interfaces', 'Vite', 'Rutas protegidas', 'Otro'
  ],
  Testing: [
    'Jest', 'Supertest', 'Pruebas de login', 'Pruebas de endpoints', 'Casos de error',
    'Validaciones', 'Permisos y roles', 'Mocking', 'Cobertura de pruebas',
    'Depuración de tests', 'Otro'
  ],
  Seguridad: [
    'JWT', 'Autenticación', 'Autorización', 'Roles y permisos', 'Hash de contraseñas',
    'bcrypt', 'Protección de rutas', 'CORS', 'Validación de datos',
    'Manejo de sesiones', 'Protección de datos sensibles', 'Buenas prácticas de seguridad', 'Otro'
  ]
}

const EJEMPLOS_OBSERVACIONES = {
  Backend: {
    'Express Router': 'Ej: Me cuesta separar rutas y controladores usando Express Router.',
    'Rutas y endpoints': 'Ej: Quiero repasar cómo definir endpoints REST para turnos y tutores.',
    Controladores: 'Ej: No sé bien qué lógica debe ir en el controlador y cuál en el servicio.',
    Servicios: 'Ej: Necesito ayuda para ordenar la lógica de negocio en servicios.',
    Middlewares: 'Ej: No entiendo cómo encadenar middlewares de validación y autenticación.',
    JWT: 'Ej: Quiero repasar cómo generar y verificar el token JWT.',
    Autenticación: 'Ej: Tengo dudas sobre el flujo de login y validación de credenciales.',
    Autorización: 'Ej: Necesito entender cómo bloquear acciones según el rol del usuario.',
    Validaciones: 'Ej: Quiero revisar validaciones de fecha, horario y datos obligatorios.',
    'Manejo de errores': 'Ej: Me cuesta centralizar errores y devolver JSON claro.',
    'Persistencia (JSON / SQLite)': 'Ej: Quiero entender cómo guardar y leer datos persistentes.',
    CRUD: 'Ej: Necesito practicar alta, baja, modificación y consulta de recursos.',
    'API REST': 'Ej: Quiero revisar buenas prácticas para diseñar una API REST.',
    'Axios (consumo de API)': 'Ej: Tengo dudas sobre cómo consumir el backend desde el front con Axios.',
    'Filtros y paginación': 'Ej: Necesito ayuda para resolver filtros, page, limit y ordenamiento.',
    Otro: 'Ej: Quiero consultar otro tema puntual de backend.'
  },
  Frontend: {
    React: 'Ej: Quiero repasar cómo organizar componentes en React.',
    Componentes: 'Ej: Me cuesta separar componentes reutilizables y pantallas.',
    'React Router': 'Ej: Tengo dudas sobre rutas protegidas y parámetros con useParams.',
    Formularios: 'Ej: Necesito ayuda con formularios controlados y validaciones visibles.',
    useState: 'Ej: Quiero entender mejor cuándo actualizar estado con useState.',
    useEffect: 'Ej: Me cuesta saber cuándo usar useEffect y sus dependencias.',
    'Context API': 'Ej: Quiero repasar cómo compartir usuario y token con Context API.',
    'Manejo de estado': 'Ej: Necesito ordenar el estado de filtros, formularios y cargas.',
    Axios: 'Ej: Tengo dudas sobre llamadas GET, POST, PUT y PATCH desde React.',
    Validaciones: 'Ej: Quiero mostrar errores de validación cerca del campo correspondiente.',
    'Manejo de errores': 'Ej: Necesito mostrar errores de API de forma clara en la pantalla.',
    'Diseño de interfaces': 'Ej: Quiero mejorar la distribución visual del formulario.',
    Vite: 'Ej: Tengo dudas sobre el proxy de Vite y las variables de entorno.',
    'Rutas protegidas': 'Ej: Quiero revisar cómo redirigir al login si no hay sesión.',
    Otro: 'Ej: Quiero consultar otro tema puntual de frontend.'
  },
  Testing: {
    Jest: 'Ej: Quiero entender cómo armar tests con Jest.',
    Supertest: 'Ej: Necesito ayuda para probar endpoints con Supertest.',
    'Pruebas de login': 'Ej: Quiero probar login correcto e incorrecto con status y JSON.',
    'Pruebas de endpoints': 'Ej: Necesito cubrir GET, POST, PUT y PATCH de turnos.',
    'Casos de error': 'Ej: Quiero probar errores 400, 401, 403 y 404.',
    Validaciones: 'Ej: Necesito tests para horarios inválidos y días no disponibles.',
    'Permisos y roles': 'Ej: Quiero verificar acciones permitidas para estudiante, tutor y admin.',
    Mocking: 'Ej: Tengo dudas sobre cuándo conviene usar mocks en tests.',
    'Cobertura de pruebas': 'Ej: Quiero revisar que casos importantes faltan cubrir.',
    'Depuración de tests': 'Ej: Tengo un test que falla y no logro encontrar la causa.',
    Otro: 'Ej: Quiero consultar otro tema puntual de testing.'
  },
  Seguridad: {
    JWT: 'Ej: Quiero repasar expiración, firma y verificación de JWT.',
    Autenticación: 'Ej: Tengo dudas sobre cómo validar identidad en el login.',
    Autorización: 'Ej: Necesito entender cómo permitir acciones según permisos.',
    'Roles y permisos': 'Ej: Quiero revisar qué puede hacer estudiante, tutor y admin.',
    'Hash de contraseñas': 'Ej: Quiero entender por qué no se guarda la contraseña en texto plano.',
    bcrypt: 'Ej: Necesito ayuda con hash y comparación de passwords usando bcrypt.',
    'Protección de rutas': 'Ej: Quiero proteger rutas del backend y del frontend.',
    CORS: 'Ej: Tengo dudas sobre CORS entre Vite y Express.',
    'Validación de datos': 'Ej: Quiero evitar datos inválidos antes de llegar al servicio.',
    'Manejo de sesiones': 'Ej: Necesito entender cómo mantener la sesión con token.',
    'Protección de datos sensibles': 'Ej: Quiero revisar qué datos no debería devolver la API.',
    'Buenas prácticas de seguridad': 'Ej: Quiero repasar buenas prácticas para proteger la app.',
    Otro: 'Ej: Quiero consultar otro tema puntual de seguridad.'
  }
}

function categoriaValida(categoria) {
  if (!categoria) return ''
  const normalizada = Object.keys(CATEGORIAS_TEMAS).find(c => normalizarTexto(c) === normalizarTexto(categoria))
  return normalizada || 'Backend'
}

function formatearEspecialidad(especialidad) {
  return categoriaValida(especialidad) || especialidad
}

function timeToMinutes(t) {
  const [hh, mm] = t.split(':').map(Number)
  return hh * 60 + mm
}

function minutesToTime(m) {
  const hh = Math.floor(m / 60)
  const mm = m % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

function addMinutes(timeStr, minutes) {
  if (!timeStr) return ''
  return minutesToTime(timeToMinutes(timeStr) + minutes)
}

function obtenerDiaSemana(fechaStr) {
  if (!fechaStr) return ''
  const [anio, mes, dia] = fechaStr.split('-').map(Number)
  return DIAS_SEMANA[new Date(anio, mes - 1, dia).getDay()]
}

function fechaLocalISO(date = new Date()) {
  const anio = date.getFullYear()
  const mes = String(date.getMonth() + 1).padStart(2, '0')
  const dia = String(date.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

function finAnioActualISO() {
  return `${new Date().getFullYear()}-12-31`
}

function validarFechaPermitida(fecha) {
  const anioActual = new Date().getFullYear()
  const hoy = fechaLocalISO()

  if (!fecha) return 'Selecciona una fecha'
  if (Number(fecha.slice(0, 4)) !== anioActual) return `Solo se pueden sacar turnos dentro del año ${anioActual}`
  if (fecha < hoy) return 'No se pueden sacar turnos en fechas anteriores a la fecha actual'
  return ''
}

function normalizarTexto(texto = '') {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function placeholderObservaciones(categoria, temas) {
  if (!categoria) return 'Ej: Escribí una duda puntual para orientar la tutoría.'
  const categoriaActual = categoriaValida(categoria)
  const temaPrincipal = temas[0]
  return EJEMPLOS_OBSERVACIONES[categoriaActual]?.[temaPrincipal]
    || `Ej: Quiero profundizar sobre ${categoriaActual.toLowerCase()} y resolver una duda puntual.`
}

function obtenerApellido(nombre = '') {
  const partes = nombre.trim().split(/\s+/)
  return partes[partes.length - 1] || ''
}

function capitalizar(valor = '') {
  return valor ? valor.charAt(0).toUpperCase() + valor.slice(1) : ''
}

function formatearListaDias(dias = []) {
  return dias.map(capitalizar).join(', ')
}

function fechaPermitidaParaTutor(fecha, tutor) {
  if (!fecha || !tutor) return false
  const dia = obtenerDiaSemana(fecha)
  return tutor.diasDisponibles.some(d => normalizarTexto(d) === normalizarTexto(dia))
}

function horaDentroDeDisponibilidad(tutor, horaInicio, horaFin) {
  if (!tutor || !horaInicio || !horaFin) return false
  const inicio = tutor.horarioDisponible?.inicio || '08:00'
  const fin = tutor.horarioDisponible?.fin || '23:00'
  return horaInicio >= inicio && horaFin <= fin && horaInicio < horaFin
}

function generarHorasInicio(tutor) {
  if (!tutor?.horarioDisponible) return []
  const inicio = timeToMinutes(tutor.horarioDisponible.inicio)
  const fin = timeToMinutes(tutor.horarioDisponible.fin)
  const opciones = []

  for (let min = inicio; min <= fin - 30; min += 30) {
    opciones.push(minutesToTime(min))
  }
  return opciones
}

function generarHorasFin(tutor, horaInicio) {
  if (!tutor?.horarioDisponible || !horaInicio) return []
  const inicio = timeToMinutes(horaInicio)
  const finTutor = timeToMinutes(tutor.horarioDisponible.fin)
  const finMaximo = Math.min(inicio + 180, finTutor)
  const opciones = []

  for (let min = inicio + 30; min <= finMaximo; min += 30) {
    opciones.push(minutesToTime(min))
  }
  return opciones
}

export default function TurnoForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario } = useAuth()

  const esEdicion = Boolean(id)

  const [form, setForm] = useState({
    tutorId: '',
    estudianteId: '',
    fecha: '',
    horaInicio: '',
    horaFin: '',
    categoria: '',
    temas: [],
    tema: '',
    modalidad: 'virtual',
    observaciones: ''
  })
  const [tutores, setTutores] = useState([])
  const [estudiantes, setEstudiantes] = useState([])
  const [busquedaTutor, setBusquedaTutor] = useState('')
  const [especialidadElegida, setEspecialidadElegida] = useState('')
  const [busquedaEstudiante, setBusquedaEstudiante] = useState('')
  const [ordenApellidoEstudiante, setOrdenApellidoEstudiante] = useState('asc')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [cargandoInicial, setCargandoInicial] = useState(esEdicion)

  useEffect(() => {
    cargarTutores()
    if (usuario?.rol !== 'estudiante') {
      cargarEstudiantes()
    }
    if (esEdicion) {
      cargarTurnoParaEditar()
    }
  }, [])

  async function cargarTutores() {
    try {
      const lista = await tutoresService.listar()
      setTutores(lista)
    } catch (err) {
      console.error('Error al cargar tutores:', err)
      setError('Error al cargar los tutores')
    }
  }

  async function cargarEstudiantes() {
    try {
      const lista = await usuariosService.listar({ rol: 'estudiante' })
      setEstudiantes(lista.filter(u => u.activo))
    } catch (err) {
      console.error('Error al cargar estudiantes:', err)
    }
  }

  async function cargarTurnoParaEditar() {
    try {
      const turno = await turnosService.obtener(parseInt(id))
      const categoria = categoriaValida(turno.categoria || turno.tutorEspecialidad)
      const temas = Array.isArray(turno.temas) && turno.temas.length > 0
        ? turno.temas
        : (turno.tema ? [turno.tema] : [])
      setForm({
        tutorId: turno.tutorId || '',
        estudianteId: turno.estudianteId || '',
        fecha: turno.fecha || '',
        horaInicio: turno.horaInicio || '',
        horaFin: turno.horaFin || '',
        categoria,
        temas,
        tema: turno.tema || temas.join(', '),
        modalidad: turno.modalidad || 'virtual',
        observaciones: turno.observaciones || ''
      })
    } catch (err) {
      setError('Error al cargar el turno')
    } finally {
      setCargandoInicial(false)
    }
  }

  const tutorSeleccionado = tutores.find(t => String(t.id) === String(form.tutorId))
  const especialidades = [...new Set(tutores.map(t => t.especialidad).filter(Boolean))].sort()
  const busquedaNormalizada = normalizarTexto(busquedaTutor.trim())

  const tutoresFiltrados = tutores.filter(tutor => {
    if (especialidadElegida && tutor.especialidad !== especialidadElegida) return false
    if (!busquedaNormalizada) return true

    const campos = [
      tutor.nombre,
      tutor.email,
      tutor.especialidad,
      tutor.diasDisponibles.join(' ')
    ].map(normalizarTexto).join(' ')

    return campos.includes(busquedaNormalizada)
  })

  const busquedaEstudianteNormalizada = normalizarTexto(busquedaEstudiante.trim())
  const estudiantesFiltrados = estudiantes
    .filter(estudiante => {
      if (!busquedaEstudianteNormalizada) return true

      const campos = [
        estudiante.nombre,
        estudiante.email,
        obtenerApellido(estudiante.nombre)
      ].map(normalizarTexto).join(' ')

      return campos.includes(busquedaEstudianteNormalizada)
    })
    .sort((a, b) => {
      const apellidoA = normalizarTexto(obtenerApellido(a.nombre))
      const apellidoB = normalizarTexto(obtenerApellido(b.nombre))
      const nombreA = normalizarTexto(a.nombre)
      const nombreB = normalizarTexto(b.nombre)
      const comparacion = apellidoA.localeCompare(apellidoB) || nombreA.localeCompare(nombreB)
      return ordenApellidoEstudiante === 'asc' ? comparacion : -comparacion
    })

  const estudianteSeleccionado = estudiantes.find(e => String(e.id) === String(form.estudianteId))

  function seleccionarTutor(tutor) {
    setError('')
    setForm(prev => {
      const categoriaTutor = categoriaValida(tutor.especialidad)
      const cambioCategoria = prev.categoria !== categoriaTutor
      const fechaValida = !prev.fecha || (!validarFechaPermitida(prev.fecha) && fechaPermitidaParaTutor(prev.fecha, tutor))
      const horasValidas = horaDentroDeDisponibilidad(tutor, prev.horaInicio, prev.horaFin)

      return {
        ...prev,
        tutorId: tutor.id,
        categoria: categoriaTutor,
        temas: cambioCategoria ? [] : prev.temas,
        tema: cambioCategoria ? '' : prev.tema,
        fecha: fechaValida ? prev.fecha : '',
        horaInicio: horasValidas ? prev.horaInicio : '',
        horaFin: horasValidas ? prev.horaFin : ''
      }
    })
    setEspecialidadElegida(tutor.especialidad || '')
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function toggleTema(tema) {
    setForm(prev => {
      const seleccionado = prev.temas.includes(tema)
      const temas = seleccionado
        ? prev.temas.filter(t => t !== tema)
        : [...prev.temas, tema]

      return {
        ...prev,
        temas,
        tema: temas.join(', ')
      }
    })
  }

  function handleFechaChange(e) {
    const value = e.target.value
    setError('')

    if (!tutorSeleccionado) {
      setError('Primero selecciona un tutor para ver sus días disponibles')
      return
    }

    const errorFecha = validarFechaPermitida(value)
    if (errorFecha) {
      setForm(prev => ({ ...prev, fecha: '', horaInicio: '', horaFin: '' }))
      setError(errorFecha)
      return
    }

    if (!fechaPermitidaParaTutor(value, tutorSeleccionado)) {
      setForm(prev => ({ ...prev, fecha: '', horaInicio: '', horaFin: '' }))
      setError(`No está disponible el tutor en ese horario. ${tutorSeleccionado.nombre} no atiende los ${capitalizar(obtenerDiaSemana(value))}. Días disponibles: ${formatearListaDias(tutorSeleccionado.diasDisponibles)}.`)
      return
    }

    setForm(prev => ({ ...prev, fecha: value }))
  }

  function handleHoraInicioChange(e) {
    const value = e.target.value
    setForm(prev => {
      const opcionesFin = generarHorasFin(tutorSeleccionado, value)
      const horaFinActualValida = opcionesFin.includes(prev.horaFin)
      return {
        ...prev,
        horaInicio: value,
        horaFin: horaFinActualValida ? prev.horaFin : (opcionesFin[0] || '')
      }
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!tutorSeleccionado) {
      setError('Selecciona un tutor')
      return
    }

    if (usuario?.rol !== 'estudiante' && !form.estudianteId) {
      setError('Selecciona un estudiante')
      return
    }

    if (!form.categoria || form.temas.length === 0) {
      setError('Selecciona un tutor y al menos un tema de su categoría')
      return
    }

    const errorFecha = validarFechaPermitida(form.fecha)
    if (errorFecha) {
      setError(errorFecha)
      return
    }

    if (!fechaPermitidaParaTutor(form.fecha, tutorSeleccionado)) {
      setError(`No está disponible el tutor en ese horario. Días disponibles: ${formatearListaDias(tutorSeleccionado.diasDisponibles)}.`)
      return
    }

    if (!horaDentroDeDisponibilidad(tutorSeleccionado, form.horaInicio, form.horaFin)) {
      const horario = tutorSeleccionado.horarioDisponible
      setError(`El horario debe estar entre ${horario.inicio} y ${horario.fin}`)
      return
    }

    setCargando(true)

    try {
      const datos = {
        ...form,
        tema: form.temas.join(', '),
        tutorId: parseInt(form.tutorId),
        estudianteId: form.estudianteId ? parseInt(form.estudianteId) : undefined
      }

      const turno = esEdicion
        ? await turnosService.editar(parseInt(id), datos)
        : await turnosService.crear(datos)

      navigate(`/turnos/${turno.id}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el turno')
    } finally {
      setCargando(false)
    }
  }

  const opcionesInicio = generarHorasInicio(tutorSeleccionado)
  const opcionesFin = generarHorasFin(tutorSeleccionado, form.horaInicio)
  const fechaMinima = fechaLocalISO()
  const fechaMaxima = finAnioActualISO()
  const temasCategoria = CATEGORIAS_TEMAS[form.categoria] || []
  const ejemploObservaciones = placeholderObservaciones(form.categoria, form.temas)

  if (cargandoInicial) return <div style={{ textAlign: 'center', padding: '60px' }}>Cargando...</div>

  return (
    <div style={{ maxWidth: '920px', margin: '24px auto', padding: '0 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '12px' }}>
        <h2 style={{ margin: 0 }}>{esEdicion ? 'Editar Turno' : 'Nuevo Turno'}</h2>
        <button onClick={() => navigate(-1)} style={{ background: '#fff', border: '1px solid #d9e2ec', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', color: '#344054' }}>
          Volver
        </button>
      </div>

      {error && (
        <div style={{ background: '#f9eaea', border: '1px solid #efc7c7', padding: '12px 14px', borderRadius: '6px', marginBottom: '16px', color: '#9f3a3a', fontWeight: '600' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <section style={{ border: '1px solid #d9e2ec', borderRadius: '8px', padding: '18px', background: '#fff', boxShadow: '0 10px 24px rgba(16, 24, 40, 0.05)' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Tutor</label>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 260px) 1fr', gap: '12px', marginBottom: '14px' }}>
            <select
              value={especialidadElegida}
              onChange={e => {
                setEspecialidadElegida(e.target.value)
                setForm(prev => ({ ...prev, tutorId: '', categoria: '', temas: [], tema: '', fecha: '', horaInicio: '', horaFin: '' }))
              }}
              style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
            >
              <option value="">Todas las Especialidades</option>
              {especialidades.map(esp => (
                <option key={esp} value={esp}>{formatearEspecialidad(esp)}</option>
              ))}
            </select>

            <input
              type="search"
              value={busquedaTutor}
              onChange={e => setBusquedaTutor(e.target.value)}
              placeholder="Buscar por Nombre o Especialidad"
              style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            {tutoresFiltrados.map(tutor => {
              const seleccionado = String(form.tutorId) === String(tutor.id)
              const horario = tutor.horarioDisponible

              return (
                <button
                  key={tutor.id}
                  type="button"
                  onClick={() => seleccionarTutor(tutor)}
                  style={{
                    textAlign: 'left',
                    border: seleccionado ? '2px solid #245b73' : '1px solid #d9e2ec',
                    background: seleccionado ? '#e8f2f6' : '#fff',
                    borderRadius: '8px',
                    padding: '14px',
                    cursor: 'pointer',
                    minHeight: '155px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start' }}>
                    <strong style={{ color: '#1f2937', fontSize: '16px' }}>{tutor.nombre}</strong>
                    <span style={{ background: '#e9f5ef', color: '#2f6f58', borderRadius: '999px', padding: '3px 8px', fontSize: '12px', whiteSpace: 'nowrap', fontWeight: '700' }}>
                      {categoriaValida(tutor.especialidad)}
                    </span>
                  </div>
                  <p style={{ margin: '8px 0 0', color: '#555', fontSize: '14px' }}>{tutor.email}</p>
                  <p style={{ margin: '10px 0 0', color: '#333', fontSize: '14px' }}>
                    <strong>Categoría:</strong> {categoriaValida(tutor.especialidad)}
                  </p>
                  <p style={{ margin: '6px 0 0', color: '#333', fontSize: '14px' }}>
                    <strong>Días:</strong> {formatearListaDias(tutor.diasDisponibles)}
                  </p>
                  <p style={{ margin: '6px 0 0', color: '#333', fontSize: '14px' }}>
                    <strong>Horario:</strong> {horario?.inicio} - {horario?.fin}
                  </p>
                </button>
              )
            })}
          </div>

          {tutoresFiltrados.length === 0 && (
            <p style={{ color: '#777', margin: '12px 0 0' }}>No hay tutores que coincidan con la búsqueda.</p>
          )}
        </section>

        {usuario?.rol !== 'estudiante' && (
          <section style={{ border: '1px solid #d9e2ec', borderRadius: '8px', padding: '18px', background: '#fff', boxShadow: '0 10px 24px rgba(16, 24, 40, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <label style={{ fontWeight: 'bold' }}>Estudiante</label>
              {estudianteSeleccionado && (
                <span style={{ color: '#245b73', fontSize: '14px', fontWeight: '700' }}>
                  Seleccionado: {estudianteSeleccionado.nombre}
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', marginBottom: '14px', alignItems: 'stretch' }}>
              <input
                type="search"
                value={busquedaEstudiante}
                onChange={e => setBusquedaEstudiante(e.target.value)}
                placeholder="Buscar por Nombre, Apellido o Email"
                style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
              />

              <button
                type="button"
                onClick={() => setOrdenApellidoEstudiante('asc')}
                style={{
                  padding: '10px 12px',
                  border: ordenApellidoEstudiante === 'asc' ? '2px solid #245b73' : '1px solid #d9e2ec',
                  background: ordenApellidoEstudiante === 'asc' ? '#e8f2f6' : '#fff',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                Apellido A-Z
              </button>

              <button
                type="button"
                onClick={() => setOrdenApellidoEstudiante('desc')}
                style={{
                  padding: '10px 12px',
                  border: ordenApellidoEstudiante === 'desc' ? '2px solid #245b73' : '1px solid #d9e2ec',
                  background: ordenApellidoEstudiante === 'desc' ? '#e8f2f6' : '#fff',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                Apellido Z-A
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {estudiantesFiltrados.map(estudiante => {
                const seleccionado = String(form.estudianteId) === String(estudiante.id)

                return (
                  <button
                    key={estudiante.id}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, estudianteId: estudiante.id }))}
                    style={{
                      textAlign: 'left',
                      border: seleccionado ? '2px solid #245b73' : '1px solid #d9e2ec',
                      background: seleccionado ? '#e8f2f6' : '#fff',
                      borderRadius: '8px',
                      padding: '14px',
                      cursor: 'pointer',
                      minHeight: '86px',
                      display: 'grid',
                      gridTemplateColumns: '1.2fr 1.2fr auto',
                      gap: '12px',
                      alignItems: 'center'
                    }}
                  >
                    <strong style={{ color: '#1f2937', fontSize: '16px' }}>{estudiante.nombre}</strong>
                    <span style={{ color: '#555', fontSize: '14px' }}>{estudiante.email}</span>
                    <span style={{ color: '#333', fontSize: '14px', justifySelf: 'end' }}>
                      <strong>Apellido:</strong> {obtenerApellido(estudiante.nombre)}
                    </span>
                  </button>
                )
              })}
            </div>

            {estudiantesFiltrados.length === 0 && (
              <p style={{ color: '#777', margin: '12px 0 0' }}>No hay estudiantes que coincidan con la búsqueda.</p>
            )}
          </section>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Fecha</label>
            <input
              type="date"
              name="fecha"
              value={form.fecha}
              onChange={handleFechaChange}
              min={fechaMinima}
              max={fechaMaxima}
              disabled={!tutorSeleccionado}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
            />
            {tutorSeleccionado && (
              <small style={{ display: 'block', color: '#666', marginTop: '5px' }}>
                Permitidos: {formatearListaDias(tutorSeleccionado.diasDisponibles)}. Rango: {fechaMinima} a {fechaMaxima}
              </small>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Hora Inicio</label>
            <select
              name="horaInicio"
              value={form.horaInicio}
              onChange={handleHoraInicioChange}
              disabled={!tutorSeleccionado || !form.fecha}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
            >
              <option value="">Selecciona inicio</option>
              {opcionesInicio.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Hora Fin</label>
            <select
              name="horaFin"
              value={form.horaFin}
              onChange={handleChange}
              disabled={!tutorSeleccionado || !form.horaInicio}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
            >
              <option value="">Selecciona fin</option>
              {opcionesFin.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
        </div>

        <section style={{ border: '1px solid #d9e2ec', borderRadius: '8px', padding: '18px', background: '#fff', boxShadow: '0 10px 24px rgba(16, 24, 40, 0.05)' }}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Categoría</label>
            <div style={{ width: '100%', padding: '10px', border: '1px solid #d9e2ec', borderRadius: '6px', boxSizing: 'border-box', background: tutorSeleccionado ? '#f8fafc' : '#f3f4f6', color: tutorSeleccionado ? '#182230' : '#667085', fontWeight: tutorSeleccionado ? '700' : '500' }}>
              {tutorSeleccionado ? form.categoria : 'Selecciona un tutor para definir la categoría'}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Temas</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '8px' }}>
              {temasCategoria.map(tema => {
                const checked = form.temas.includes(tema)
                return (
                  <label
                    key={tema}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      border: checked ? '2px solid #245b73' : '1px solid #d9e2ec',
                      background: checked ? '#e8f2f6' : '#fff',
                      borderRadius: '6px',
                      padding: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTema(tema)}
                    />
                    <span>{tema}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <div style={{ marginTop: '14px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
              Observaciones o Consulta Específica (opcional)
            </label>
            <textarea
              name="observaciones"
              value={form.observaciones}
              onChange={handleChange}
              rows={4}
              placeholder={ejemploObservaciones}
              style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
            />
          </div>
        </section>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Modalidad</label>
          <select
            name="modalidad"
            value={form.modalidad}
            onChange={handleChange}
            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
          >
            <option value="virtual">Virtual</option>
            <option value="presencial">Presencial</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={cargando}
          style={{ padding: '14px', background: '#245b73', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: '800' }}
        >
          {cargando ? 'Guardando...' : (esEdicion ? 'Guardar Cambios' : 'Solicitar Turno')}
        </button>
      </form>
    </div>
  )
}
