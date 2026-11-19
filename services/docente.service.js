// services/docente.service.js
import Docente from '../models/docente.model.js';
import Usuario from '../models/usuario.model.js';
import Role from '../models/role.model.js';

class DocenteService {

  async getAll() {
    return await Docente.findAll({
      where: { estado: true },
      include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'usuario', 'estado'] }],
      order: [['apellidos', 'ASC']],
    });
  }

  async getById(id) {
    const docente = await Docente.findByPk(id, {
      include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'usuario', 'estado'] }],
    });
    if (!docente) throw new Error('Docente no encontrado');
    return docente;
  }

  async create(data) {
    const { nombres, apellidos, identificacion, especialidad, usuario, password } = data;

    if (identificacion) {
      const existing = await Docente.findOne({ where: { identificacion } });
      if (existing) throw new Error('Ya existe un docente con esta identificación');
    }

    // 1. Crear el docente
    const docente = await Docente.create({
      nombres, apellidos, identificacion, especialidad, estado: true,
    });

    // 2. Crear usuario (SIN CIFRAR AQUÍ - el modelo lo hará)
    if (usuario && password) {
      const existingUser = await Usuario.findOne({ where: { usuario } });
      if (existingUser) throw new Error('El nombre de usuario ya existe');

      const rolDocente = await Role.findOne({ where: { nombre: 'DOCENTE' } });
      if (!rolDocente) throw new Error('No se encontró el rol DOCENTE');

      // ✅ NO CIFRAMOS AQUÍ - El hook beforeCreate del modelo lo hará
      await Usuario.create({
        usuario,
        password,  // ← Contraseña en texto plano, el modelo la cifra
        rol_id: rolDocente.id,
        docente_id: docente.id,
        estado: true,
      });
    }

    return docente;
  }

  async update(id, data) {
    const docente = await this.getById(id);
    if (data.identificacion && data.identificacion !== docente.identificacion) {
      const existing = await Docente.findOne({ where: { identificacion: data.identificacion } });
      if (existing) throw new Error('Ya existe un docente con esta identificación');
    }
    await docente.update(data);
    return docente;
  }

    // 🗑️ Eliminar (desactivar) docente liberando identificación y usuario
  async delete(id) {
    const docente = await this.getById(id);
    
    // 1. Desactivar el usuario y liberar su nombre de usuario
    if (docente.usuario) {
      await docente.usuario.update({ 
        estado: false,
        usuario: `${docente.usuario.usuario}_DEL_${Date.now()}`
      });
    }
    
    // 2. Desactivar al docente y liberar su cédula
    await docente.update({ 
      estado: false,
            identificacion: docente.identificacion ? `${docente.identificacion}_${Date.now().toString(36)}` : null  
    });
    
    return { message: 'Docente y usuario desactivados correctamente' };
  }

    // 🔑 Restablecer (o asignar) la contraseña de un docente — solo ADMIN
  async resetPassword(id, { password, usuario }) {
    if (!password || password.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }

    const docente = await this.getById(id);

    // a) Ya tiene usuario: solo se cambia la contraseña
    if (docente.usuario) {
      const user = await Usuario.findByPk(docente.usuario.id);
      await user.update({ password }); // el hook del modelo la cifra
      return { usuario: user.usuario, creado: false };
    }

    // b) No tiene usuario: se le crea su acceso
    const nombreUsuario = (usuario || '').trim();
    if (!nombreUsuario) {
      throw new Error('Este docente no tiene usuario. Escribe un nombre de usuario para crearle el acceso.');
    }

    const existe = await Usuario.findOne({ where: { usuario: nombreUsuario } });
    if (existe) throw new Error('El nombre de usuario ya existe');

    const rolDocente = await Role.findOne({ where: { nombre: 'DOCENTE' } });
    if (!rolDocente) throw new Error('No se encontró el rol DOCENTE');

    await Usuario.create({
      usuario: nombreUsuario,
      password,
      rol_id: rolDocente.id,
      docente_id: docente.id,
      estado: true,
    });

    return { usuario: nombreUsuario, creado: true };
  }

  async search(termino) {
    const { Op } = await import('sequelize');
    return await Docente.findAll({
      where: {
        estado: true,
        [Op.or]: [
          { nombres: { [Op.like]: `%${termino}%` } },
          { apellidos: { [Op.like]: `%${termino}%` } },
        ],
      },
      include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'usuario', 'estado'] }],
      order: [['apellidos', 'ASC']],
    });
  }
}

export default DocenteService;