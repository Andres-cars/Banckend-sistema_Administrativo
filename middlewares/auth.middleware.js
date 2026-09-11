// src/middlewares/auth.middleware.js
import jwt from 'jsonwebtoken';
import { TOKEN_KEY } from '../config/config.js';
import Usuario from '../models/usuario.model.js';

export const verifyToken = async (req, res, next) => {
  try {
    // Obtener el token del header Authorization
    const tokenHeader = req.header('Authorization');

    if (!tokenHeader || !tokenHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado. Token no proporcionado.',
      });
    }

    // Extraer el token (quitar "Bearer ")
    const token = tokenHeader.split(' ')[1];

    // Verificar el token
    const decoded = jwt.verify(token, TOKEN_KEY);

    // Verificar que el usuario existe y está activo
    const user = await Usuario.findByPk(decoded.id);

    if (!user || !user.estado) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado o inactivo',
      });
    }

    // Adjuntar usuario decodificado a la request
    req.user = decoded;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Error al verificar el token',
    });
  }
};