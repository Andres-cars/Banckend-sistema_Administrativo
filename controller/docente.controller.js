// src/controllers/docente.controller.js
import DocenteService from '../services/docente.service.js';

const docenteService = new DocenteService();

// 📋 Listar todos los docentes
export const getAll = async (req, res) => {
  try {
    const docentes = await docenteService.getAll();
    return res.json({
      success: true,
      data: docentes,
      total: docentes.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener docentes',
    });
  }
};

// 🔍 Obtener un docente por ID
export const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const docente = await docenteService.getById(Number(id));
    return res.json({
      success: true,
      data: docente,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message || 'Docente no encontrado',
    });
  }
};

// 📝 Crear un nuevo docente (con usuario automático)
export const create = async (req, res) => {
  try {
    const { nombres, apellidos, identificacion, especialidad, usuario, password } = req.body;

    if (!nombres || !apellidos) {
      return res.status(400).json({
        success: false,
        message: 'Nombres y apellidos son obligatorios',
      });
    }

    // Si se proporciona usuario, la contraseña también es obligatoria
    if (usuario && !password) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña es obligatoria si se crea un usuario',
      });
    }

    const docente = await docenteService.create({
      nombres,
      apellidos,
      identificacion,
      especialidad,
      usuario,
      password,
    });

    return res.status(201).json({
      success: true,
      message: usuario ? 'Docente y usuario creados correctamente' : 'Docente creado correctamente',
      data: docente,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error al crear docente',
    });
  }
};

// ✏️ Actualizar un docente
export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombres, apellidos, identificacion, especialidad } = req.body;

    const docente = await docenteService.update(Number(id), {
      nombres,
      apellidos,
      identificacion,
      especialidad,
    });

    return res.json({
      success: true,
      message: 'Docente actualizado correctamente',
      data: docente,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error al actualizar docente',
    });
  }
};

// 🗑️ Eliminar (desactivar) un docente
export const deleteDocente = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await docenteService.delete(Number(id));
    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error al eliminar docente',
    });
  }
};

// 🔍 Buscar docentes
export const search = async (req, res) => {
  try {
    const { termino } = req.query;
    if (!termino) {
      return await getAll(req, res);
    }
    const docentes = await docenteService.search(termino);
    return res.json({
      success: true,
      data: docentes,
      total: docentes.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al buscar docentes',
    });
  }
};