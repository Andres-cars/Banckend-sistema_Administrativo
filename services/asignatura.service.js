// src/services/asignatura.service.js
import Asignatura from '../models/asignatura.model.js';

class AsignaturaService {
  
  // 📋 Listar todas las asignaturas
  async getAll() {
    return await Asignatura.findAll({
      where: { estado: true },
      order: [['nombre', 'ASC']],
    });
  }

  // 🔍 Obtener asignatura por ID
  async getById(id) {
    const asignatura = await Asignatura.findByPk(id);
    if (!asignatura) {
      throw new Error('Asignatura no encontrada');
    }
    return asignatura;
  }

  // 📝 Crear asignatura
  async create(data) {
    const { nombre, codigo, horas_semanales } = data;

    // Verificar si ya existe por nombre
    const existingNombre = await Asignatura.findOne({ where: { nombre } });
    if (existingNombre) {
      throw new Error('Ya existe una asignatura con este nombre');
    }

    // Verificar si ya existe por código
    if (codigo) {
      const existingCodigo = await Asignatura.findOne({ where: { codigo } });
      if (existingCodigo) {
        throw new Error('Ya existe una asignatura con este código');
      }
    }

    const asignatura = await Asignatura.create({
      nombre,
      codigo,
      horas_semanales,
      estado: true,
    });

    return asignatura;
  }

  // ✏️ Actualizar asignatura
  async update(id, data) {
    const asignatura = await this.getById(id);

    if (data.nombre && data.nombre !== asignatura.nombre) {
      const existing = await Asignatura.findOne({ where: { nombre: data.nombre } });
      if (existing) {
        throw new Error('Ya existe una asignatura con este nombre');
      }
    }

    if (data.codigo && data.codigo !== asignatura.codigo) {
      const existing = await Asignatura.findOne({ where: { codigo: data.codigo } });
      if (existing) {
        throw new Error('Ya existe una asignatura con este código');
      }
    }

    await asignatura.update(data);
    return asignatura;
  }

  // 🗑️ Eliminar (desactivar) asignatura
  async delete(id) {
    const asignatura = await this.getById(id);
    await asignatura.update({ estado: false });
    return { message: 'Asignatura desactivada correctamente' };
  }

  // 🔍 Buscar asignaturas
  async search(termino) {
    const { Op } = await import('sequelize');
    return await Asignatura.findAll({
      where: {
        estado: true,
        [Op.or]: [
          { nombre: { [Op.like]: `%${termino}%` } },
          { codigo: { [Op.like]: `%${termino}%` } },
        ],
      },
      order: [['nombre', 'ASC']],
    });
  }
}

export default AsignaturaService;