// controller/admin.controller.js
import AdminService from '../services/admin.service.js';

const adminService = new AdminService();

// 📋 Listar administradores
export const getAll = async (req, res) => {
  try {
    const admins = await adminService.getAll();
    return res.json({
      success: true,
      data: admins,
      total: admins.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener administradores',
    });
  }
};

// 🔍 Obtener administrador por ID
export const getById = async (req, res) => {
  try {
    const admin = await adminService.getById(Number(req.params.id));
    return res.json({ success: true, data: admin });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message || 'Administrador no encontrado',
    });
  }
};

// 📝 Crear administrador
export const create = async (req, res) => {
  try {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
      return res.status(400).json({
        success: false,
        message: 'Usuario y contraseña son obligatorios',
      });
    }

    const admin = await adminService.create({ usuario, password });

    return res.status(201).json({
      success: true,
      message: 'Administrador creado correctamente',
      data: admin,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error al crear administrador',
    });
  }
};

// ✏️ Actualizar administrador
export const update = async (req, res) => {
  try {
    const admin = await adminService.update(Number(req.params.id), req.body);
    return res.json({
      success: true,
      message: 'Administrador actualizado correctamente',
      data: admin,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error al actualizar administrador',
    });
  }
};

// 🗑️ Eliminar administrador
export const deleteAdmin = async (req, res) => {
  try {
    const result = await adminService.delete(Number(req.params.id));
    return res.json({ success: true, ...result });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error al eliminar administrador',
    });
  }
};