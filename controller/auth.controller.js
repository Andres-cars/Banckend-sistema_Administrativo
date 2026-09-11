// src/controllers/auth.controller.js
import AuthService from '../services/auth.service.js';

const authService = new AuthService();

// 🔐 Login
export const login = async (req, res) => {
  try {
    const { usuario, password } = req.body;

    // Validar que lleguen los datos
    if (!usuario || !password) {
      return res.status(400).json({
        success: false,
        message: 'Usuario y contraseña son obligatorios',
      });
    }

    const result = await authService.login(usuario, password);

    return res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      ...result,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Error en la autenticación',
    });
  }
};

// 👤 Obtener perfil del usuario autenticado
export const getProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
      });
    }

    const usuario = await authService.getProfile(userId);

    return res.json({
      success: true,
      data: usuario,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message || 'Usuario no encontrado',
    });
  }
};

// 🚪 Logout
export const logout = async (req, res) => {
  return res.json({
    success: true,
    message: 'Sesión cerrada correctamente',
  });
};