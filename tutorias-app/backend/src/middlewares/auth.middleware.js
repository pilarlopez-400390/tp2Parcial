// auth.middleware.js - Verifica que el JWT del header sea válido
//
// Un middleware en Express es una función con firma (req, res, next).
//   req  → el objeto del pedido (lo que llega del cliente)
//   res  → el objeto de respuesta (lo que enviamos de vuelta)
//   next → función que llama al SIGUIENTE middleware o a la ruta final
//
// Si llamamos a next() sin argumentos → seguimos el flujo normal.
// Si llamamos a next(error)           → saltamos directo al errorHandler.

const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {

  // 1. Buscamos el header "Authorization"
  //    El cliente debe enviar: Authorization: Bearer <token>
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    // 401 = Unauthorized: no envió token en absoluto
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  // 2. El header tiene formato "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...."
  //    Lo partimos por espacio y tomamos la segunda parte (índice 1)
  const partes = authHeader.split(' ');
  const token  = partes[1];

  if (!token) {
    return res.status(401).json({ error: 'Formato de token inválido. Usá: Bearer <token>' });
  }

  // 3. Verificamos la firma y la expiración del token
  try {
    // jwt.verify devuelve el PAYLOAD si el token es válido,
    // o lanza una excepción si es inválido o expiró.
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Guardamos el payload en req.user para que los siguientes
    //    middlewares y la ruta final puedan saber quién es el usuario.
    //    payload contiene: { id, nombre, email, rol, iat, exp }
    req.user = payload;

    // 5. Llamamos a next() para continuar al siguiente middleware o ruta
    next();

  } catch (err) {
    // TokenExpiredError, JsonWebTokenError, etc.
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = verificarToken;
