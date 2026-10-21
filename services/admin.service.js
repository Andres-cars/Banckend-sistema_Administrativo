// services/admin.service.js
import Usuario from '../models/usuario.model.js';
import Role from '../models/role.model.js';

class AdminService {

  // 📋 Listar solo administradores
  async getAll() {
    const rolAdmin = await Role.findOne({ where: { nombre: 'ADMINISTRADOR' } });
    if (!rolAdmin) throw new Error('Rol ADMINISTRADOR no encontrado');

    return await Usuario.findAll({
      where: { rol_id: rolAdmin.id, estado: true },
      include: [{ model: Role, as: 'rol', attributes: ['id', 'nombre'] }],
      attributes: { exclude: ['password'] },
      order: [['id', 'DESC']],
    });
  }

  // 🔍 Obtener administrador por ID
  async getById(id) {
    const usuario = await Usuario.findByPk(id, {
      include: [{ model: Role, as: 'rol', attributes: ['id', 'nombre'] }],
      attributes: { exclude: ['password'] },
    });

    if (!usuario) throw new Error('Administrador no encontrado');

    // Verificar que sea administrador
    if (usuario.rol?.nombre !== 'ADMINISTRADOR') {
      throw new Error('El usuario no es administrador');
    }

    return usuario;
  }

  // 📝 Crear nuevo administrador
  async create(data) {
    const { usuario, password } = data;

    if (!usuario || !password) {
      throw new Error('Usuario y contraseña son obligatorios');
    }

    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    // Verificar que el usuario no exista
    const existing = await Usuario.findOne({ where: { usuario } });
    if (existing) {
      throw new Error('El nombre de usuario ya existe');
    }

    // Obtener el rol ADMINISTRADOR
    const rolAdmin = await Role.findOne({ where: { nombre: 'ADMINISTRADOR' } });
    if (!rolAdmin) throw new Error('Rol ADMINISTRADOR no encontrado');

    // Crear admin (el hook del modelo cifra la contraseña)
    const nuevo = await Usuario.create({
      usuario,
      password,
      rol_id: rolAdmin.id,
      docente_id: null,
      estado: true,
    });

    return {
      id: nuevo.id,
      usuario: nuevo.usuario,
      rol: 'ADMINISTRADOR',
      estado: nuevo.estado,
    };
  }

  // ✏️ Actualizar administrador (solo contraseña o estado)
  async update(id, data) {
    const admin = await this.getById(id);

    // Solo permitir cambiar la contraseña
    if (data.password && data.password.trim() !== '') {
      if (data.password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }
      await admin.update({ password: data.password });
    }

    return {
      id: admin.id,
      usuario: admin.usuario,
      rol: admin.rol?.nombre,
    };
  }

  // 🗑️ Desactivar administrador
  async delete(id) {
    const admin = await this.getById(id);

    // No permitir eliminar al último admin activo
    const rolAdmin = await Role.findOne({ where: { nombre: 'ADMINISTRADOR' } });
    const totalAdmins = await Usuario.count({
      where: { rol_id: rolAdmin.id, estado: true },
    });

    if (totalAdmins <= 1) {
      throw new Error('No se puede eliminar al último administrador del sistema');
    }

    await admin.update({ estado: false });
    return { message: 'Administrador desactivado correctamente' };
  }
}

export default AdminService;