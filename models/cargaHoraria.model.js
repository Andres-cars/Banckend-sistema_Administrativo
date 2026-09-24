// src/models/cargaHoraria.model.js
import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import Docente from './docente.model.js';
import Asignatura from './asignatura.model.js';
import Curso from './curso.model.js';
import PeriodoAcademico from './periodoAcademico.model.js';

class CargaHoraria extends Model {}

CargaHoraria.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    docente_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    asignatura_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    curso_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    periodo_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    horas_semanales: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      validate: {
        min: 1,
        max: 20,
      },
    },
    estado: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'cargas_horarias',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

// ============================================
// RELACIONES
// ============================================

CargaHoraria.belongsTo(Docente, { foreignKey: 'docente_id', as: 'docente' });
CargaHoraria.belongsTo(Asignatura, { foreignKey: 'asignatura_id', as: 'asignatura' });
CargaHoraria.belongsTo(Curso, { foreignKey: 'curso_id', as: 'curso' });
CargaHoraria.belongsTo(PeriodoAcademico, { foreignKey: 'periodo_id', as: 'periodo' });

Docente.hasMany(CargaHoraria, { foreignKey: 'docente_id', as: 'cargas' });
Asignatura.hasMany(CargaHoraria, { foreignKey: 'asignatura_id', as: 'cargas' });
Curso.hasMany(CargaHoraria, { foreignKey: 'curso_id', as: 'cargas' });
PeriodoAcademico.hasMany(CargaHoraria, { foreignKey: 'periodo_id', as: 'cargas' });

export default CargaHoraria;