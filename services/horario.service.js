// services/horario.service.js
import { generarHorario } from '../algorithms/genetic/genetic-algorithm.js';
import Horario from '../models/horario.model.js';
import DetalleHorario from '../models/detalleHorario.model.js';
import CargaHoraria from '../models/cargaHoraria.model.js';
import Docente from '../models/docente.model.js';
import Asignatura from '../models/asignatura.model.js';
import Curso from '../models/curso.model.js';
import Aula from '../models/aula.model.js';
import Usuario from '../models/usuario.model.js';
import PeriodoAcademico from '../models/periodoAcademico.model.js';
import Jornada from '../models/jornada.model.js';
import { sequelize } from '../config/database.js';

class HorarioService {

  // 🧬 Generar horario con algoritmo genético
  async generar(periodoId, jornadaId, cursoId = null) {
    console.log('🧬 Generando horario...');

    const resultado = await generarHorario({
      periodoId,
      jornadaId,
      cursoId, 
      tamañoPoblacion: 100,
      generaciones: 500,
      tasaCruce: 0.8,
      tasaMutacion: 0.05,
      fitnessMinimo: 95,
    });
    // Si faltan clases, lanzar advertencia
  if (!resultado.completo) {
    console.warn(`⚠️ ATENCIÓN: Faltan ${resultado.clasesFaltantes} clases por asignar`);
  }

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
      include: [
        { model: PeriodoAcademico, as: 'periodo', attributes: ['id', 'nombre'] },
        { model: Jornada, as: 'jornada', attributes: ['id', 'nombre'] },
      ],
      order: [['id', 'DESC']],
    });
  }

  // 🔍 OBTENER HORARIO CON DATOS ANIDADOS (CORREGIDO)
  async getById(id) {
    const horario = await Horario.findByPk(id, {
      include: [
               { model: PeriodoAcademico, as: 'periodo', attributes: ['id', 'nombre'] },
        { model: Jornada, as: 'jornada', attributes: ['id', 'nombre', 'hora_inicio', 'hora_fin'] },
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

    // 👨‍🏫 MIS CLASES: horario y carga del docente que inició sesión
  async getMisClases(usuarioId) {
    const usuario = await Usuario.findByPk(usuarioId, {
      include: [{ model: Docente, as: 'docente', attributes: ['id', 'nombres', 'apellidos', 'especialidad'] }],
    });

    if (!usuario || !usuario.docente) {
      throw new Error('Este usuario no está vinculado a ningún docente');
    }

    return this.getClasesDocente(usuario.docente);
  }

  // 👨‍🏫 CLASES DE UN DOCENTE (lo usan el docente y el administrador)
  async getClasesDocente(docenteOId, periodoId = null) {
    const docente = typeof docenteOId === 'object'
      ? docenteOId
      : await Docente.findByPk(docenteOId, { attributes: ['id', 'nombres', 'apellidos', 'especialidad'] });

    if (!docente) {
      throw new Error('Docente no encontrado');
    }

    // 1b. ✅ Periodo: el indicado o, si no, el actual (el activo más reciente)
    const periodo = periodoId
      ? await PeriodoAcademico.findByPk(periodoId)
      : await PeriodoAcademico.findOne({ where: { estado: true }, order: [['fecha_inicio', 'DESC']] });
    const filtroPeriodo = periodo ? { periodo_id: periodo.id } : {};

    // 2. Su carga horaria (solo del periodo)
    const cargas = await CargaHoraria.findAll({
      where: { docente_id: docente.id, estado: true, ...filtroPeriodo },
      include: [
        { model: Asignatura, as: 'asignatura', attributes: ['id', 'nombre', 'codigo'] },
        { model: Curso, as: 'curso', attributes: ['id', 'nivel', 'grado', 'paralelo'] },
      ],
      order: [['id', 'ASC']],
    });

    const cargaPorId = new Map(cargas.map(c => [c.id, c]));
    let clases = [];

    if (cargas.length > 0) {
      // 3. Sus clases en los horarios guardados (solo activos y PUBLICADOS - HU-13)
      const detalles = await DetalleHorario.findAll({
        where: { carga_horaria_id: [...cargaPorId.keys()] },
        include: [
          { model: Horario, as: 'horario', where: { estado: true, publicado: true, ...filtroPeriodo }, attributes: ['id', 'nombre'] },
          { model: Aula, as: 'aula', attributes: ['id', 'nombre'] },
        ],
        order: [['horario_id', 'DESC']],
      });

      // 4. Si un curso tiene varios horarios guardados, usar solo el más reciente
      const horarioVigentePorCurso = new Map();
      for (const d of detalles) {
        const cursoId = cargaPorId.get(d.carga_horaria_id).curso_id;
        if (!horarioVigentePorCurso.has(cursoId)) {
          horarioVigentePorCurso.set(cursoId, d.horario_id);
        }
      }

      const ordenDias = { LUNES: 1, MARTES: 2, MIERCOLES: 3, JUEVES: 4, VIERNES: 5, SABADO: 6 };

      clases = detalles
        .filter(d => horarioVigentePorCurso.get(cargaPorId.get(d.carga_horaria_id).curso_id) === d.horario_id)
        .map(d => {
          const carga = cargaPorId.get(d.carga_horaria_id);
          return {
            id: d.id,
            dia: d.dia_semana,
            hora_inicio: String(d.hora_inicio).slice(0, 5),
            hora_fin: String(d.hora_fin).slice(0, 5),
            asignatura: carga.asignatura?.nombre || '',
            curso: `${carga.curso?.grado || ''} "${carga.curso?.paralelo || ''}"`,
            nivel: carga.curso?.nivel || '',
            aula: d.aula?.nombre || '',
            horario: d.horario?.nombre || '',
          };
        })
        .sort((a, b) => (ordenDias[a.dia] - ordenDias[b.dia]) || a.hora_inicio.localeCompare(b.hora_inicio));
    }

    // 5. Respuesta
    return {
      periodo: periodo ? { id: periodo.id, nombre: periodo.nombre } : null, // ✅ periodo mostrado
      docente: {
        id: docente.id,
        nombres: docente.nombres,
        apellidos: docente.apellidos,
        especialidad: docente.especialidad,
      },
      cargas: cargas.map(c => ({
        id: c.id,
        asignatura: c.asignatura?.nombre || '',
        codigo: c.asignatura?.codigo || '',
        curso: `${c.curso?.grado || ''} "${c.curso?.paralelo || ''}"`,
        nivel: c.curso?.nivel || '',
        horas_semanales: c.horas_semanales,
      })),
      totalHoras: cargas.reduce((suma, c) => suma + Number(c.horas_semanales || 0), 0),
      clases,
    };
  }

  // 📢 HU-13: Publicar / retirar un horario
  // Al publicar, se retira el que estaba publicado antes para el mismo curso
  // (así siempre hay una sola versión oficial por curso).
  async cambiarPublicacion(id, publicado) {
    const horario = await Horario.findByPk(id);
    if (!horario || !horario.estado) {
      throw new Error('Horario no encontrado');
    }

    const transaccion = await sequelize.transaction();
    try {
      let retirados = [];

      if (publicado) {
        // Cursos que tiene este horario
        const detalles = await DetalleHorario.findAll({
          where: { horario_id: id },
          include: [{ model: CargaHoraria, as: 'carga_horaria', attributes: ['curso_id'] }],
          transaction: transaccion,
        });
        const cursoIds = [...new Set(detalles.map(d => d.carga_horaria?.curso_id).filter(Boolean))];

        if (cursoIds.length) {
          // Otros horarios publicados de esos mismos cursos
          const otros = await DetalleHorario.findAll({
            attributes: ['horario_id'],
            include: [
              { model: CargaHoraria, as: 'carga_horaria', attributes: [], where: { curso_id: cursoIds } },
              { model: Horario, as: 'horario', attributes: ['id', 'nombre'], where: { estado: true, publicado: true } },
            ],
            transaction: transaccion,
          });
          const idsOtros = [...new Set(otros.map(o => o.horario_id))].filter(x => x !== id);

          if (idsOtros.length) {
            await Horario.update(
              { publicado: false },
              { where: { id: idsOtros }, transaction: transaccion }
            );
            retirados = [...new Map(otros.filter(o => idsOtros.includes(o.horario_id))
              .map(o => [o.horario_id, o.horario?.nombre])).values()];
          }
        }
      }

      await horario.update(
        publicado ? { publicado: true, fecha_publicacion: new Date() } : { publicado: false },
        { transaction: transaccion }
      );

      await transaccion.commit();
      return { id: horario.id, nombre: horario.nombre, publicado, retirados };
    } catch (error) {
      await transaccion.rollback();
      throw error;
    }
  }

  // 🗑️ Eliminar horario
  async delete(id) {
    const horario = await Horario.findByPk(id);
    if (!horario) {
      throw new Error('Horario no encontrado');
    }
    const estabaPublicado = !!horario.publicado;
    await horario.update({ estado: false, publicado: false });
    return {
      message: 'Horario eliminado correctamente',
      nombre: horario.nombre,      // ✅ RN-12: para el historial
      estabaPublicado,
    };
  }
}

export default HorarioService;