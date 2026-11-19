// src/controllers/cargaHoraria.controller.js
import CargaHorariaService from '../services/cargaHoraria.service.js';
import HistorialService from '../services/historial.service.js'; // ✅ RN-12

const cargaService = new CargaHorariaService();
const historial = new HistorialService(); // ✅ RN-12

// 📋 Listar cargas horarias
export const getAll = async (req, res) => {
  try {
    const cargas = await cargaService.getAll();
    return res.json({
      success: true,
      data: cargas,
      total: cargas.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener cargas horarias',
    });
  }
};

// 🔍 Obtener carga por ID
export const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const carga = await cargaService.getById(Number(id));
    return res.json({
      success: true,
      data: carga,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message || 'Carga horaria no encontrada',
    });
  }
};

// 📝 Crear carga horaria
export const create = async (req, res) => {
  try {
    const { docente_id, asignatura_id, curso_id, periodo_id, horas_semanales } = req.body;

    if (!docente_id || !asignatura_id || !curso_id || !periodo_id || !horas_semanales) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios',
      });
    }

    const carga = await cargaService.create({
      docente_id,
      asignatura_id,
      curso_id,
      periodo_id,
      horas_semanales,
    });

    // ✅ RN-12: registrar en el historial
    const nueva = await cargaService.getById(carga.id);
    await historial.registrar({
      usuarioId: req.user?.id,
      tabla: 'cargas_horarias',
      registroId: carga.id,
      accion: 'CREAR',
      descripcion: `Creó la carga: ${historial.describirCarga(nueva)}`,
    });

    return res.status(201).json({
      success: true,
      message: 'Carga horaria creada correctamente',
      data: carga,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error al crear carga horaria',
    });
  }
};

// ✏️ Actualizar carga horaria
export const update = async (req, res) => {
  try {
    const { id } = req.params;
      const data = req.body;

    // ✅ RN-12: guardar cómo estaba antes de cambiarla
    const antes = (await cargaService.getById(Number(id))).toJSON();

    const carga = await cargaService.update(Number(id), data);

    // ✅ RN-12: registrar en el historial qué cambió
    const despues = await cargaService.getById(Number(id));
    await historial.registrar({
      usuarioId: req.user?.id,
      tabla: 'cargas_horarias',
      registroId: Number(id),
      accion: 'EDITAR',
      descripcion: `Editó la carga ${historial.describirCarga(antes)}: ${historial.cambiosCarga(antes, despues)}`,
    });

    return res.json({
      success: true,
      message: 'Carga horaria actualizada correctamente',
      data: carga,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error al actualizar carga horaria',
    });
  }
};

// 🗑️ Eliminar carga horaria
export const deleteCarga = async (req, res) => {
  try {
        const { id } = req.params;

    // ✅ RN-12: datos de la carga antes de eliminarla
    const carga = await cargaService.getById(Number(id));

    const result = await cargaService.delete(Number(id));

    await historial.registrar({
      usuarioId: req.user?.id,
      tabla: 'cargas_horarias',
      registroId: Number(id),
      accion: 'ELIMINAR',
      descripcion: `Eliminó la carga: ${historial.describirCarga(carga)}`,
    });
    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error al eliminar carga horaria',
    });
  }
};

// 🔍 Obtener cargas por docente
export const getByDocente = async (req, res) => {
  try {
    const { docenteId } = req.params;
    const cargas = await cargaService.getByDocente(Number(docenteId));
    return res.json({
      success: true,
      data: cargas,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener cargas del docente',
    });
  }
};

// 🔍 Obtener cargas por curso
export const getByCurso = async (req, res) => {
  try {
    const { cursoId } = req.params;
    const cargas = await cargaService.getByCurso(Number(cursoId));
    return res.json({
      success: true,
      data: cargas,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener cargas del curso',
    });
  }
};