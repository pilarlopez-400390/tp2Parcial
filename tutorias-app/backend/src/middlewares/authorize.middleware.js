// authorize.middleware.js - Controla que el usuario tenga el rol correcto
//
// Este middleware se usa DESPUÉS de verificarToken (que ya puso req.user).
//
// Es una "función que devuelve una función" (Higher Order Function):
//   autorizar('admin')        → solo admins
//   autorizar('admin','tutor') → admins o tutores
//
// Ejemplo de uso en una ruta:
//   router.patch('/:id/confirmar', verificarToken, autorizar('tutor','admin'), controller.confirmar)

function autorizar(...rolesPermitidos) {
  // rolesPermitidos es un array de strings: ['admin', 'tutor'] por ejemplo

  // Devolvemos el middleware real
  return function (req, res, next) {

    // req.user fue puesto por verificarToken en el paso anterior
    const rol = req.user.rol;

    // includes() verifica si el rol del usuario está en la lista de permitidos
    if (!rolesPermitidos.includes(rol)) {
      // 403 = Forbidden: el token es válido, pero el rol no alcanza
      return res.status(403).json({
        error: `Acceso denegado. Se requiere uno de estos roles: ${rolesPermitidos.join(', ')}`
      });
    }

    // Si el rol está permitido, seguimos
    next();
  };
}

module.exports = autorizar;
