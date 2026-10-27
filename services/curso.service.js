// src/services/curso.service.js
import Curso from '../models/curso.model.js';
import Aula from '../models/aula.model.js'; 

class CursoService {
  
  // 📋 Listar todos los cursos
  async getAll() {
    return await Curso.findAll({
      where: { estado: true },
      include: [{ model: Aula, as: 'aula', attributes: ['id', 'nombre'] }],
      order: [['nivel', 'ASC'], ['grado', 'ASC'], ['paralelo', 'ASC']],
    });
  }

  // 🔍 Obtener un curso por ID
  async getById(id) {
    const curso = await Curso.findByPk(id,  {
      include: [{ model: Aula, as: 'aula', attributes: ['id', 'nombre'] }] // ✅ INCLUIR AULA
    });
    if (!curso) {
      throw new Error('Curso no encontrado');
    }
    return curso;
  }

  // 📝 Crear un nuevo curso
  async create(data) {
    const { nivel, grado, paralelo, aula_id  } = data;

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
      tipo_educacion, // ✅ Guardamos el tipo
      aula_id, 
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
    // 🗑️ Eliminar (desactivar) curso liberando el paralelo
  async delete(id) {
    const curso = await this.getById(id);
    await curso.update({ 
      estado: false,
      paralelo: `${curso.paralelo}_DEL_${Date.now()}`
    });
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
      include: [{ model: Aula, as: 'aula', attributes: ['id', 'nombre'] }], 
      order: [['nivel', 'ASC']],
    });
  }
}

export default CursoService;