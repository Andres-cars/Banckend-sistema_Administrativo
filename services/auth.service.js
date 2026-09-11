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
}

export default AuthService;