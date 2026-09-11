// src/controllers/curso.controller.js
import CursoService from '../services/curso.service.js';

const cursoService = new CursoService();

// 📋 Listar cursos
export const getAll = async (req, res) => {
  try {
    const cursos = await cursoService.getAll();
    return res.json({
      success: true,
      data: cursos,
      total: cursos.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener cursos',
    });
  }
};

// 🔍 Obtener curso por ID
export const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const curso = await cursoService.getById(Number(id));
    return res.json({
      success: true,
      data: curso,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message || 'Curso no encontrado',
    });
  }
};

// 📝 Crear curso
export const create = async (req, res) => {
  try {
    const { nivel, grado, paralelo } = req.body;

    if (!nivel || !grado || !paralelo) {
      return res.status(400).json({
        success: false,
        message: 'Nivel, grado y paralelo son obligatorios',
      });
    }

    const curso = await cursoService.create({ nivel, grado, paralelo });

    return res.status(201).json({
      success: true,
      message: 'Curso creado correctamente',
      data: curso,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error al crear curso',
    });
  }
};

// ✏️ Actualizar curso
export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nivel, grado, paralelo } = req.body;

    const curso = await cursoService.update(Number(id), {
      nivel, grado, paralelo,
    });

    return res.json({
      success: true,
      message: 'Curso actualizado correctamente',
      data: curso,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error al actualizar curso',
    });
  }
};

// 🗑️ Eliminar curso
export const deleteCurso = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await cursoService.delete(Number(id));
    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error al eliminar curso',
    });
  }
};

// 🔍 Buscar cursos
export const search = async (req, res) => {
  try {
    const { termino } = req.query;
    if (!termino) {
      return await getAll(req, res);
    }
    const cursos = await cursoService.search(termino);
    return res.json({
      success: true,
      data: cursos,
      total: cursos.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al buscar cursos',
    });
  }
};