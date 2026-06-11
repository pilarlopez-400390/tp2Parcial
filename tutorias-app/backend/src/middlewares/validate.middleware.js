// validate.middleware.js - Validacion basica de entrada para rutas HTTP.

function validarBody({ requeridos = [], permitidos = [] } = {}) {
  return function (req, res, next) {
    const body = req.body || {};

    for (const campo of requeridos) {
      if (body[campo] === undefined || body[campo] === null || body[campo] === '') {
        return res.status(400).json({ error: `El campo ${campo} es obligatorio` });
      }
    }

    if (permitidos.length > 0) {
      const desconocidos = Object.keys(body).filter(campo => !permitidos.includes(campo));
      if (desconocidos.length > 0) {
        return res.status(400).json({ error: `Campos no permitidos: ${desconocidos.join(', ')}` });
      }
    }

    next();
  };
}

module.exports = { validarBody };
