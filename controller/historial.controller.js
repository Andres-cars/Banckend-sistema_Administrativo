// controller/historial.controller.js
// ✅ RN-12: consultar el historial de cambios (solo ADMIN)
import HistorialService from '../services/historial.service.js';

const historialService = new HistorialService();

export const getAll = async (req, res) => {
  try {
    const { tabla, limite } = req.query;
    const historial = await historialService.getAll({ tabla, limite });
    return res.json({
      success: true,
      data: historial,
      total: historial.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener el historial de cambios',
    });
  }
};