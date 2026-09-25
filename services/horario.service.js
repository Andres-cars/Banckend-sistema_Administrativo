// services/horario.service.js
import { generarHorario } from '../algorithms/genetic/genetic-algorithm.js';
import Horario from '../models/horario.model.js';
import DetalleHorario from '../models/detalleHorario.model.js';
import CargaHoraria from '../models/cargaHoraria.model.js';
import Docente from '../models/docente.model.js';
import Asignatura from '../models/asignatura.model.js';
import Curso from '../models/curso.model.js';
import Aula from '../models/aula.model.js';
import { sequelize } from '../config/database.js';

class HorarioService {

  // 🧬 Generar horario con algoritmo genético
  async generar(periodoId, jornadaId) {
    console.log('🧬 Generando horario...');

    const resultado = await generarHorario({
      periodoId,
      jornadaId,
      tamañoPoblacion: 100,
      generaciones: 500,
      tasaCruce: 0.8,
      tasaMutacion: 0.05,
      fitnessMinimo: 95,
    });

    return resultado;
  }

  // 💾 Guardar horario en la base de datos
  async guardar(periodoId, jornadaId, nombre, clases) {
    const transaccion = await sequelize.transaction();

    try {
      const horario = await Horario.create({
        periodo_id: periodoId,
        jornada_id: jornadaId,
        nombre,
        generado_automaticamente: true,
        estado: true,
      }, { transaction: transaccion });

      const detalles = clases.map(c => ({
        horario_id: horario.id,
        carga_horaria_id: c.cargaHorariaId,
        aula_id: c.aulaId,
        dia_semana: c.dia,
        hora_inicio: c.horaInicio,
        hora_fin: c.horaFin,
      }));

      await DetalleHorario.bulkCreate(detalles, { transaction: transaccion });

      await transaccion.commit();

      return {
        id: horario.id,
        nombre: horario.nombre,
        totalClases: detalles.length,
      };
    } catch (error) {
      await transaccion.rollback();
      throw error;
    }
  }

  // 📋 Listar horarios
  async getAll() {
    return await Horario.findAll({
      where: { estado: true },
      order: [['id', 'DESC']],
    });
  }

  // 🔍 OBTENER HORARIO CON DATOS ANIDADOS (CORREGIDO)
  async getById(id) {
    const horario = await Horario.findByPk(id, {
      include: [
        {
          model: DetalleHorario,
          as: 'detalles',
          include: [
            {
              model: CargaHoraria,
              as: 'carga_horaria',
              include: [
                { model: Docente, as: 'docente', attributes: ['id', 'nombres', 'apellidos'] },
                { model: Asignatura, as: 'asignatura', attributes: ['id', 'nombre', 'codigo'] },
                { model: Curso, as: 'curso', attributes: ['id', 'nivel', 'grado', 'paralelo'] },
              ],
            },
            {
              model: Aula,
              as: 'aula',
              attributes: ['id', 'nombre', 'tipo'],
            },
          ],
        },
      ],
    });

    if (!horario) {
      throw new Error('Horario no encontrado');
    }

    return horario;
  }

  // 🗑️ Eliminar horario
  async delete(id) {
    const horario = await Horario.findByPk(id);
    if (!horario) {
      throw new Error('Horario no encontrado');
    }
    await horario.update({ estado: false });
    return { message: 'Horario eliminado correctamente' };
  }
}

export default HorarioService;