// src/services/curso.service.js
import Curso from '../models/curso.model.js';

class CursoService {
  
  // 📋 Listar todos los cursos
  async getAll() {
    return await Curso.findAll({
      where: { estado: true },
      order: [['nivel', 'ASC'], ['grado', 'ASC'], ['paralelo', 'ASC']],
    });
  }

  // 🔍 Obtener un curso por ID
  async getById(id) {
    const curso = await Curso.findByPk(id);
    if (!curso) {
      throw new Error('Curso no encontrado');
    }
    return curso;
  }

  // 📝 Crear un nuevo curso
  async create(data) {
    const { nivel, grado, paralelo } = data;

    // Verificar si ya existe
    const existing = await Curso.findOne({ 
      where: { nivel, grado, paralelo } 
    });
    if (existing) {
      throw new Error('Ya existe un curso con este nivel, grado y paralelo');
    }

    const curso = await Curso.create({
      nivel,
      grado,
      paralelo,
      estado: true,
    });

    return curso;
  }

  // ✏️ Actualizar un curso
  async update(id, data) {
    const curso = await this.getById(id);

    if (data.nivel || data.grado || data.paralelo) {
      const newNivel = data.nivel || curso.nivel;
      const newGrado = data.grado || curso.grado;
      const newParalelo = data.paralelo || curso.paralelo;

      const existing = await Curso.findOne({ 
        where: { 
          nivel: newNivel, 
          grado: newGrado, 
          paralelo: newParalelo 
        } 
      });
      
      if (existing && existing.id !== curso.id) {
        throw new Error('Ya existe un curso con estos datos');
      }
    }

    await curso.update(data);
    return curso;
  }

  // 🗑️ Eliminar (desactivar) un curso
  async delete(id) {
    const curso = await this.getById(id);
    await curso.update({ estado: false });
    return { message: 'Curso desactivado correctamente' };
  }

  // 🔍 Buscar cursos
  async search(termino) {
    const { Op } = await import('sequelize');
    return await Curso.findAll({
      where: {
        estado: true,
        [Op.or]: [
          { nivel: { [Op.like]: `%${termino}%` } },
          { grado: { [Op.like]: `%${termino}%` } },
        ],
      },
      order: [['nivel', 'ASC']],
    });
  }
}

export default CursoService;