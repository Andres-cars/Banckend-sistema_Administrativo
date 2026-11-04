// src/services/curso.service.js
import Curso from '../models/curso.model.js';
import Aula from '../models/aula.model.js'; 

/**
 * Tipo de educación según el grado (define qué bloques horarios usa el curso):
 *  - BGU / Bachillerato        → BACHILLERATO (07:30–13:05, recreo 10:30–10:50)
 *  - 8vo, 9no, 10mo            → BASICA       (07:30–13:05, recreo 10:30–10:50)
 *  - Inicial, 1ro a 7mo        → ESCUELA      (07:30–12:00, recreo 10:00–10:30)
 */
export function tipoEducacionDe(nivel = '', grado = '') {
  const texto = `${nivel} ${grado}`.toUpperCase();
  if (texto.includes('BGU') || texto.includes('BACHILLERATO')) return 'BACHILLERATO';
  const numero = parseInt(String(grado).trim(), 10);
  if ([8, 9, 10].includes(numero)) return 'BASICA';
  return 'ESCUELA';
}

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
    const { nivel, grado, paralelo, tipo_educacion, aula_id } = data;

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
      tipo_educacion: tipo_educacion || tipoEducacionDe(nivel, grado), // si el formulario no lo envía, se deduce del grado
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

    // Si cambia el nivel o el grado y no se envía el tipo, se recalcula
    if (!data.tipo_educacion && (data.nivel || data.grado)) {
      data.tipo_educacion = tipoEducacionDe(data.nivel || curso.nivel, data.grado || curso.grado);
    }
    if (!data.tipo_educacion) delete data.tipo_educacion;

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