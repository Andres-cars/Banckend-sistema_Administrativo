// src/services/cargaHoraria.service.js
import CargaHoraria from '../models/cargaHoraria.model.js';
import Docente from '../models/docente.model.js';
import Asignatura from '../models/asignatura.model.js';
import Curso from '../models/curso.model.js';
import PeriodoAcademico from '../models/periodoAcademico.model.js';

class CargaHorariaService {
  
  // 📋 Listar todas las cargas horarias
  async getAll() {
    return await CargaHoraria.findAll({
      where: { estado: true },
      include: [
        { model: Docente, as: 'docente', attributes: ['id', 'nombres', 'apellidos'] },
        { model: Asignatura, as: 'asignatura', attributes: ['id', 'nombre', 'codigo'] },
        { model: Curso, as: 'curso', attributes: ['id', 'nivel', 'grado', 'paralelo'] },
        { model: PeriodoAcademico, as: 'periodo', attributes: ['id', 'nombre'] },
      ],
      order: [['id', 'DESC']],
    });
  }

  // 🔍 Obtener carga horaria por ID
  async getById(id) {
    const carga = await CargaHoraria.findByPk(id, {
      include: [
        { model: Docente, as: 'docente' },
        { model: Asignatura, as: 'asignatura' },
        { model: Curso, as: 'curso' },
        { model: PeriodoAcademico, as: 'periodo' },
      ],
    });
    if (!carga) {
      throw new Error('Carga horaria no encontrada');
    }
    return carga;
  }

  // 📝 Crear carga horaria
  async create(data) {
    const { docente_id, asignatura_id, curso_id, periodo_id, horas_semanales } = data;

    // Verificar si ya existe una carga con estos datos
    const existing = await CargaHoraria.findOne({
      where: { docente_id, asignatura_id, curso_id, periodo_id }
    });
    if (existing) {
      throw new Error('Ya existe una carga horaria con estos datos');
    }

    const carga = await CargaHoraria.create({
      docente_id,
      asignatura_id,
      curso_id,
      periodo_id,
      horas_semanales,
      estado: true,
    });

    return carga;
  }

  // ✏️ Actualizar carga horaria
  async update(id, data) {
    const carga = await this.getById(id);
    await carga.update(data);
    return carga;
  }

  // 🗑️ Eliminar (desactivar) carga horaria
  async delete(id) {
    const carga = await this.getById(id);
    await carga.update({ estado: false });
    return { message: 'Carga horaria desactivada correctamente' };
  }

  // 🔍 Obtener cargas por docente
  async getByDocente(docenteId) {
    return await CargaHoraria.findAll({
      where: { docente_id: docenteId, estado: true },
      include: [
        { model: Asignatura, as: 'asignatura' },
        { model: Curso, as: 'curso' },
      ],
    });
  }

  // 🔍 Obtener cargas por curso
  async getByCurso(cursoId) {
    return await CargaHoraria.findAll({
      where: { curso_id: cursoId, estado: true },
      include: [
        { model: Docente, as: 'docente' },
        { model: Asignatura, as: 'asignatura' },
      ],
    });
  }
}

export default CargaHorariaService;