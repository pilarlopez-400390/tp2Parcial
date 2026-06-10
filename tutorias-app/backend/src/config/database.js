// database.js - Capa de persistencia usando archivos JSON
// Usamos archivos JSON porque el enunciado lo permite y no requiere drivers nativos.
// Cada "tabla" es un archivo .json en la carpeta data/ (o data-test/ cuando corremos tests).

const fs   = require('fs');
const path = require('path');

// Si estamos en modo test (NODE_ENV=test), usamos una carpeta separada
// para no contaminar los datos reales mientras corremos los tests.
const DATA_DIR = process.env.NODE_ENV === 'test'
  ? path.join(__dirname, '../../data-test')
  : path.join(__dirname, '../../data');

// Creamos la carpeta si no existe (la primera vez que se corre)
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ─── FUNCIONES INTERNAS ─────────────────────────────────────────────────────

// Lee el archivo JSON de una tabla y devuelve el array de registros.
// Si el archivo no existe, devuelve un array vacío.
function readTable(tabla) {
  const filePath = path.join(DATA_DIR, `${tabla}.json`);
  if (!fs.existsSync(filePath)) return [];
  const contenido = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(contenido);
}

// Escribe el array de registros en el archivo JSON de la tabla.
function writeTable(tabla, datos) {
  const filePath = path.join(DATA_DIR, `${tabla}.json`);
  // null, 2 → formatea el JSON con indentación de 2 espacios (más legible)
  fs.writeFileSync(filePath, JSON.stringify(datos, null, 2), 'utf-8');
}

// ─── API PÚBLICA ─────────────────────────────────────────────────────────────

// Devuelve TODOS los registros de una tabla (array).
function findAll(tabla) {
  return readTable(tabla);
}

// Busca UN registro por id. Devuelve el objeto o null si no existe.
function findById(tabla, id) {
  const datos = readTable(tabla);
  for (let i = 0; i < datos.length; i++) {
    if (datos[i].id === id) return datos[i];
  }
  return null;
}

// Inserta un nuevo registro. Le asigna un id autoincremental.
// Devuelve el registro ya guardado (con su nuevo id).
function insert(tabla, registro) {
  const datos = readTable(tabla);

  // Calculamos el próximo id: buscamos el máximo id existente + 1
  let maxId = 0;
  for (let i = 0; i < datos.length; i++) {
    if (datos[i].id > maxId) maxId = datos[i].id;
  }

  const nuevoRegistro = { id: maxId + 1, ...registro };
  datos.push(nuevoRegistro);
  writeTable(tabla, datos);
  return nuevoRegistro;
}

// Actualiza un registro por id aplicando los campos de 'updates'.
// Devuelve el registro actualizado, o null si no se encontró.
function update(tabla, id, updates) {
  const datos = readTable(tabla);
  for (let i = 0; i < datos.length; i++) {
    if (datos[i].id === id) {
      // Spread: combina el registro existente con los nuevos valores
      datos[i] = { ...datos[i], ...updates };
      writeTable(tabla, datos);
      return datos[i];
    }
  }
  return null;
}

// Borra TODOS los registros de una tabla. Se usa en los tests para
// resetear el estado entre ejecuciones.
function clear(tabla) {
  writeTable(tabla, []);
}

// Elimina un registro por id. Devuelve true si se eliminó, false si no existía.
function remove(tabla, id) {
  const datos = readTable(tabla);
  const nuevos = datos.filter(r => r.id !== id);
  if (nuevos.length === datos.length) return false;
  writeTable(tabla, nuevos);
  return true;
}

module.exports = { findAll, findById, insert, update, clear, remove, writeTable, readTable };
