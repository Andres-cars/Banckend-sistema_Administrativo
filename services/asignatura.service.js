// src/services/asignatura.service.js
import { Op } from 'sequelize';
import Asignatura from '../models/asignatura.model.js';

class AsignaturaService {
  
  // 📋 Listar todas las asignaturas
    // 📋 Listar asignaturas
  // - Por defecto solo las ACTIVAS (para cargas horarias, dashboard, etc.)
  // - Con incluirInactivas = true, también las desactivadas (pantalla de Asignaturas)
  async getAll(incluirInactivas = false) {
    const where = incluirInactivas
      ? { nombre: { [Op.notLike]: '%\\_DEL\\_%' } } // oculta las eliminadas con el método antiguo
      : { estado: true };

    return await Asignatura.findAll({
      where,
      order: [['estado', 'DESC'], ['nombre', 'ASC']],
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
      throw new Error(existingNombre.estado
        ? 'Ya existe una asignatura con este nombre'
        : 'Ya existe una asignatura con este nombre, pero está desactivada. Actívala en lugar de crearla de nuevo.');
    }

    // Verificar si ya existe por código
    if (codigo) {
      const existingCodigo = await Asignatura.findOne({ where: { codigo } });
          if (existingCodigo) {
        throw new Error(existingCodigo.estado
          ? 'Ya existe una asignatura con este código'
          : 'Ya existe una asignatura con este código, pero está desactivada. Actívala en lugar de crearla de nuevo.');
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

    // 🔄 Activar / desactivar asignatura (no se borra nada)
  async cambiarEstado(id, estado) {
    const asignatura = await this.getById(id);
    await asignatura.update({ estado: !!estado });
    return asignatura;
  }
   // 🗑️ Eliminar (desactivar) asignatura liberando el nombre y código
  async delete(id) {
    const asignatura = await this.getById(id);
    await asignatura.update({ 
      estado: false,
      nombre: `${asignatura.nombre}_DEL_${Date.now()}`,
      codigo: asignatura.codigo ? `${asignatura.codigo}_DEL_${Date.now()}` : null
    });
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