// src/services/auth.service.js
import jwt from 'jsonwebtoken';
import { TOKEN_KEY, JWT_EXPIRES } from '../config/config.js';
import Usuario from '../models/usuario.model.js';
import Role from '../models/role.model.js';

class AuthService {
  
  // 🔐 Login
  async login(usuario, password) {
    // Buscar usuario con su rol
    const user = await Usuario.findOne({
      where: { usuario, estado: true },
      include: [{ model: Role, as: 'rol' }],
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar contraseña
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      throw new Error('Contraseña incorrecta');
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        id: user.id,
        usuario: user.usuario,
        rol: user.rol?.nombre || null,
        rol_id: user.rol_id,
      },
      TOKEN_KEY,
      { expiresIn: JWT_EXPIRES }
    );

    return {
      token,
      usuario: {
        id: user.id,
        usuario: user.usuario,
        rol: user.rol?.nombre || null,
        rol_id: user.rol_id,
      },
    };
  }

  // 👤 Obtener perfil del usuario
  async getProfile(userId) {
    const user = await Usuario.findByPk(userId, {
      include: [{ model: Role, as: 'rol', attributes: ['id', 'nombre'] }],
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return user;
  }

    // 🔒 Cambiar mi propia contraseña (cualquier usuario autenticado)
  async cambiarPassword(userId, passwordActual, passwordNueva) {
    if (!passwordActual || !passwordNueva) {
      throw new Error('Debes escribir tu contraseña actual y la nueva');
    }
    if (passwordNueva.length < 8) {
      throw new Error('La nueva contraseña debe tener al menos 8 caracteres');
    }
    if (passwordActual === passwordNueva) {
      throw new Error('La nueva contraseña debe ser diferente a la actual');
    }

    const user = await Usuario.findByPk(userId);
    if (!user) throw new Error('Usuario no encontrado');

    const correcta = await user.comparePassword(passwordActual);
    if (!correcta) throw new Error('La contraseña actual es incorrecta');

    await user.update({ password: passwordNueva }); // el hook del modelo la cifra
    return true;
  }
}

export default AuthService;