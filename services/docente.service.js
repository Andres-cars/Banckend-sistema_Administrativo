// src/services/docente.service.js
import Docente from '../models/docente.model.js';
import Usuario from '../models/usuario.model.js';
import Role from '../models/role.model.js';
import bcrypt from 'bcrypt';

class DocenteService {
  
  // 📋 Listar todos los docentes (con su usuario)
  async getAll() {
    return await Docente.findAll({
      where: { estado: true },
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'usuario', 'estado'],
        },
      ],
      order: [['apellidos', 'ASC']],
    });
  }

  // 🔍 Obtener un docente por ID (con su usuario)
  async getById(id) {
    const docente = await Docente.findByPk(id, {
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'usuario', 'estado'],
        },
      ],
    });
    if (!docente) {
      throw new Error('Docente no encontrado');
    }
    return docente;
  }

  // 📝 Crear un nuevo docente (con usuario automático)
  async create(data) {
    const { nombres, apellidos, identificacion, especialidad, usuario, password } = data;

    // Verificar si ya existe un docente con la misma identificación
    if (identificacion) {
      const existing = await Docente.findOne({ where: { identificacion } });
      if (existing) {
        throw new Error('Ya existe un docente con esta identificación');
      }
    }

    // 1. Crear el docente
    const docente = await Docente.create({
      nombres,
      apellidos,
      identificacion,
      especialidad,
      estado: true,
    });

    // 2. Si se proporcionó usuario y contraseña, crear el usuario asociado
    if (usuario && password) {
      const existingUser = await Usuario.findOne({ where: { usuario } });
      if (existingUser) {
        throw new Error('El nombre de usuario ya existe');
      }

      // Buscar el rol DOCENTE por nombre en vez de asumir el ID
      const rolDocente = await Role.findOne({ where: { nombre: 'DOCENTE' } });
      if (!rolDocente) {
        throw new Error('No se encontró el rol DOCENTE en la base de datos');
      }

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      await Usuario.create({
        usuario,
        password: hash,
        rol_id: rolDocente.id,
        docente_id: docente.id,
        estado: true,
      });
    }

    return docente;
  }

  // ✏️ Actualizar un docente
  async update(id, data) {
    const docente = await this.getById(id);

    if (data.identificacion && data.identificacion !== docente.identificacion) {
      const existing = await Docente.findOne({ 
        where: { identificacion: data.identificacion } 
      });
      if (existing) {
        throw new Error('Ya existe un docente con esta identificación');
      }
    }

    await docente.update(data);
    return docente;
  }

  // 🗑️ Eliminar (desactivar) un docente y su usuario
  async delete(id) {
    const docente = await this.getById(id);
    
    // Desactivar el usuario asociado
    if (docente.usuario) {
      await docente.usuario.update({ estado: false });
    }
    
    await docente.update({ estado: false });
    return { message: 'Docente y usuario desactivados correctamente' };
  }

  // 🔍 Buscar docentes por nombre
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
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'usuario', 'estado'],
        },
      ],
      order: [['apellidos', 'ASC']],
    });
  }
}

export default DocenteService;