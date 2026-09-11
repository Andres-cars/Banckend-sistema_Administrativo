// src/middlewares/role.middleware.js

// Verificar que sea ADMINISTRADOR
export const isAdmin = (req, res, next) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Usuario no autenticado',
    });
  }

  if (user.rol !== 'ADMINISTRADOR') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requiere rol de ADMINISTRADOR',
    });
  }

  next();
};

// Verificar que sea DOCENTE
export const isDocente = (req, res, next) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Usuario no autenticado',
    });
  }

  if (user.rol !== 'DOCENTE') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requiere rol de DOCENTE',
    });
  }

  next();
};

// Verificar cualquier rol permitido
export const hasRole = (allowedRoles) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
      });
    }

    if (!allowedRoles.includes(user.rol)) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. Se requiere uno de estos roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};