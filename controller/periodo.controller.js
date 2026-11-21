// controller/periodo.controller.js
// ✅ Periodos académicos
import PeriodoService from '../services/periodo.service.js';

const periodoService = new PeriodoService();

// 📋 Listar  (?todos=true incluye los desactivados)
export const getAll = async (req, res) => {
  try {
    const periodos = await periodoService.getAll(req.query.todos === 'true');
    return res.json({ success: true, data: periodos });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener los periodos académicos',
    });
  }
};

// 📅 Periodo actual (el activo más reciente)
export const getActual = async (req, res) => {
  try {
    const periodo = await periodoService.getActual();
    return res.json({ success: true, data: periodo });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener el periodo actual',
    });
  }
};

// 🔍 Obtener por ID
export const getById = async (req, res) => {
  try {
    const periodo = await periodoService.getById(Number(req.params.id));
    return res.json({ success: true, data: periodo });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message || 'Periodo académico no encontrado',
    });
  }
};

// 📝 Crear
export const create = async (req, res) => {
  try {
    const periodo = await periodoService.create(req.body);
    return res.status(201).json({
      success: true,
      message: 'Periodo académico creado correctamente',
      data: periodo,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error al crear el periodo académico',
    });
  }
};

// ✏️ Editar
export const update = async (req, res) => {
  try {
    const periodo = await periodoService.update(Number(req.params.id), req.body);
    return res.json({
      success: true,
      message: 'Periodo académico actualizado correctamente',
      data: periodo,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error al actualizar el periodo académico',
    });
  }
};

// ⏸️ Activar / desactivar
export const cambiarEstado = async (req, res) => {
  try {
    const { estado } = req.body;
    if (typeof estado !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'El campo "estado" debe ser true o false',
      });
    }

    const periodo = await periodoService.cambiarEstado(Number(req.params.id), estado);
    return res.json({
      success: true,
      message: estado ? 'Periodo académico activado' : 'Periodo académico desactivado',
      data: periodo,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error al cambiar el estado del periodo',
    });
  }
};