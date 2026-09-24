// src/controllers/aula.controller.js
import AulaService from '../services/aula.service.js';

const aulaService = new AulaService();

// 📋 Listar aulas
export const getAll = async (req, res) => {
  try {
    const aulas = await aulaService.getAll();
    return res.json({
      success: true,
      data: aulas,
      total: aulas.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener aulas',
    });
  }
};

// 🔍 Obtener aula por ID
export const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const aula = await aulaService.getById(Number(id));
    return res.json({
      success: true,
      data: aula,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message || 'Aula no encontrada',
    });
  }
};

// 📝 Crear aula
export const create = async (req, res) => {
  try {
    const { nombre, capacidad, tipo } = req.body;

    if (!nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del aula es obligatorio',
      });
    }

    const aula = await aulaService.create({
      nombre,
      capacidad,
      tipo,
    });

    return res.status(201).json({
      success: true,
      message: 'Aula creada correctamente',
      data: aula,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error al crear aula',
    });
  }
};

// ✏️ Actualizar aula
export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, capacidad, tipo } = req.body;

    const aula = await aulaService.update(Number(id), {
      nombre,
      capacidad,
      tipo,
    });

    return res.json({
      success: true,
      message: 'Aula actualizada correctamente',
      data: aula,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error al actualizar aula',
    });
  }
};

// 🗑️ Eliminar aula
export const deleteAula = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await aulaService.delete(Number(id));
    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error al eliminar aula',
    });
  }
};

// 🔍 Buscar aulas
export const search = async (req, res) => {
  try {
    const { termino } = req.query;
    if (!termino) {
      return await getAll(req, res);
    }
    const aulas = await aulaService.search(termino);
    return res.json({
      success: true,
      data: aulas,
      total: aulas.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al buscar aulas',
    });
  }
};