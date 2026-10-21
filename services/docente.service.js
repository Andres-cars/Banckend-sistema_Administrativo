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

  async delete(id) {
    const docente = await this.getById(id);
    if (docente.usuario) await docente.usuario.update({ estado: false });
    await docente.update({ estado: false });
    return { message: 'Docente y usuario desactivados correctamente' };
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