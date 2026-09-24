// src/services/aula.service.js
import Aula from '../models/aula.model.js';

class AulaService {
  
  // 📋 Listar todas las aulas
  async getAll() {
    return await Aula.findAll({
      where: { estado: true },
      order: [['nombre', 'ASC']],
    });
  }

  // 🔍 Obtener aula por ID
  async getById(id) {
    const aula = await Aula.findByPk(id);
    if (!aula) {
      throw new Error('Aula no encontrada');
    }
    return aula;
  }

  // 📝 Crear aula
  async create(data) {
    const { nombre, capacidad, tipo } = data;

    // Verificar si ya existe por nombre
    const existing = await Aula.findOne({ where: { nombre } });
    if (existing) {
      throw new Error('Ya existe un aula con este nombre');
    }

    const aula = await Aula.create({
      nombre,
      capacidad,
      tipo,
      estado: true,
    });

    return aula;
  }

  // ✏️ Actualizar aula
  async update(id, data) {
    const aula = await this.getById(id);

    if (data.nombre && data.nombre !== aula.nombre) {
      const existing = await Aula.findOne({ where: { nombre: data.nombre } });
      if (existing) {
        throw new Error('Ya existe un aula con este nombre');
      }
    }

    await aula.update(data);
    return aula;
  }

  // 🗑️ Eliminar (desactivar) aula
  async delete(id) {
    const aula = await this.getById(id);
    await aula.update({ estado: false });
    return { message: 'Aula desactivada correctamente' };
  }

  // 🔍 Buscar aulas
  async search(termino) {
    const { Op } = await import('sequelize');
    return await Aula.findAll({
      where: {
        estado: true,
        [Op.or]: [
          { nombre: { [Op.like]: `%${termino}%` } },
          { tipo: { [Op.like]: `%${termino}%` } },
        ],
      },
      order: [['nombre', 'ASC']],
    });
  }
}

export default AulaService;