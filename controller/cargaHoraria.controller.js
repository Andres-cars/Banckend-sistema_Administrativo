// src/controllers/cargaHoraria.controller.js
import CargaHorariaService from '../services/cargaHoraria.service.js';

const cargaService = new CargaHorariaService();

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

    const carga = await cargaService.update(Number(id), data);

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
    const result = await cargaService.delete(Number(id));
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