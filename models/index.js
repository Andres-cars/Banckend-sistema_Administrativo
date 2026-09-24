// src/models/index.js
import { sequelize } from '../config/database.js';
import Role from './role.model.js';
import Usuario from './usuario.model.js';
import Docente from './docente.model.js';
import Curso from './curso.model.js'; 
import Asignatura from './asignatura.model.js';
import Aula from './aula.model.js';
import CargaHoraria from './cargaHoraria.model.js';

// Exportar todos los modelos
export {
  sequelize,
  Role,
  Usuario,
  Docente,
  Curso,
  Asignatura,
  Aula,
  CargaHoraria,
};

// Función para sincronizar la base de datos
export const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ alter: false, force });
    console.log('✅ Base de datos sincronizada correctamente');
  } catch (error) {
    console.error('❌ Error al sincronizar la base de datos:', error);
    throw error;
  }
};