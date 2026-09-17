// src/controllers/asignatura.controller.js
import AsignaturaService from '../services/asignatura.service.js';

const asignaturaService = new AsignaturaService();

// 📋 Listar asignaturas
export const getAll = async (req, res) => {
  try {
    const asignaturas = await asignaturaService.getAll();
    return res.json({
      success: true,
      data: asignaturas,
      total: asignaturas.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener asignaturas',
    });
  }
};

// 🔍 Obtener asignatura por ID
export const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const asignatura = await asignaturaService.getById(Number(id));
    return res.json({
      success: true,
      data: asignatura,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message || 'Asignatura no encontrada',
    });
  }
};

// 📝 Crear asignatura
export const create = async (req, res) => {
  try {
    const { nombre, codigo, horas_semanales } = req.body;

    if (!nombre || !horas_semanales) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y horas semanales son obligatorios',
      });
    }

    const asignatura = await asignaturaService.create({
      nombre,
      codigo,
      horas_semanales,
    });

    return res.status(201).json({
      success: true,
      message: 'Asignatura creada correctamente',
      data: asignatura,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error al crear asignatura',
    });
  }
};

// ✏️ Actualizar asignatura
export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, codigo, horas_semanales } = req.body;

    const asignatura = await asignaturaService.update(Number(id), {
      nombre,
      codigo,
      horas_semanales,
    });

    return res.json({
      success: true,
      message: 'Asignatura actualizada correctamente',
      data: asignatura,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error al actualizar asignatura',
    });
  }
};

// 🗑️ Eliminar asignatura
export const deleteAsignatura = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await asignaturaService.delete(Number(id));
    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error al eliminar asignatura',
    });
  }
};

// 🔍 Buscar asignaturas
export const search = async (req, res) => {
  try {
    const { termino } = req.query;
    if (!termino) {
      return await getAll(req, res);
    }
    const asignaturas = await asignaturaService.search(termino);
    return res.json({
      success: true,
      data: asignaturas,
      total: asignaturas.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al buscar asignaturas',
    });
  }
};