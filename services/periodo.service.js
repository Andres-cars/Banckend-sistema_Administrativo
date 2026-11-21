// services/periodo.service.js
// ✅ Periodos académicos: crear, editar y activar/desactivar años lectivos
import { Op } from 'sequelize';
import PeriodoAcademico from '../models/periodoAcademico.model.js';

class PeriodoService {

  // 📋 Listar periodos (el más reciente primero)
  //    incluirInactivos = true → también los desactivados (para la pantalla de administración)
  async getAll(incluirInactivos = false) {
    return await PeriodoAcademico.findAll({
      where: incluirInactivos ? {} : { estado: true },
      order: [['fecha_inicio', 'DESC']],
    });
  }

  // 🔍 Obtener por ID
  async getById(id) {
    const periodo = await PeriodoAcademico.findByPk(id);
    if (!periodo) {
      throw new Error('Periodo académico no encontrado');
    }
    return periodo;
  }

  // 📅 Periodo actual: el activo más reciente
  async getActual() {
    return await PeriodoAcademico.findOne({
      where: { estado: true },
      order: [['fecha_inicio', 'DESC']],
    });
  }

  // ✅ Validaciones comunes de crear y editar
  async validar({ nombre, fecha_inicio, fecha_fin }, idActual = null) {
    if (!nombre || !String(nombre).trim()) {
      throw new Error('El nombre del periodo es obligatorio');
    }
    if (!fecha_inicio || !fecha_fin) {
      throw new Error('Las fechas de inicio y fin son obligatorias');
    }
    if (fecha_fin <= fecha_inicio) {
      throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
    }

    const otroId = idActual ? { id: { [Op.ne]: idActual } } : {};

    // Nombre único
    const mismoNombre = await PeriodoAcademico.findOne({
      where: { nombre: String(nombre).trim(), ...otroId },
    });
    if (mismoNombre) {
      throw new Error('Ya existe un periodo con ese nombre');
    }

    // Dos años lectivos activos no pueden cruzarse en las fechas
    const cruce = await PeriodoAcademico.findOne({
      where: {
        estado: true,
        fecha_inicio: { [Op.lte]: fecha_fin },
        fecha_fin: { [Op.gte]: fecha_inicio },
        ...otroId,
      },
    });
    if (cruce) {
      throw new Error(`Las fechas se cruzan con el periodo "${cruce.nombre}"`);
    }
  }

  // 📝 Crear periodo
  async create(data) {
    await this.validar(data);
    return await PeriodoAcademico.create({
      nombre: String(data.nombre).trim(),
      fecha_inicio: data.fecha_inicio,
      fecha_fin: data.fecha_fin,
      estado: true,
    });
  }

  // ✏️ Editar periodo
  async update(id, data) {
    const periodo = await this.getById(id);
    const nuevo = {
      nombre: data.nombre ?? periodo.nombre,
      fecha_inicio: data.fecha_inicio ?? periodo.fecha_inicio,
      fecha_fin: data.fecha_fin ?? periodo.fecha_fin,
    };
    await this.validar(nuevo, periodo.id);
    await periodo.update({ ...nuevo, nombre: String(nuevo.nombre).trim() });
    return periodo;
  }

  // ⏸️ Activar / desactivar
  //    No se elimina: las cargas y los horarios del periodo se conservan como historial.
  async cambiarEstado(id, estado) {
    const periodo = await this.getById(id);

    if (!estado) {
      const activos = await PeriodoAcademico.count({ where: { estado: true } });
      if (activos <= 1 && periodo.estado) {
        throw new Error('Debe quedar al menos un periodo académico activo');
      }
    }

    await periodo.update({ estado });
    return periodo;
  }
}

export default PeriodoService;