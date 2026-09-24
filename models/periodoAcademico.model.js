// src/models/periodoAcademico.model.js
import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

class PeriodoAcademico extends Model {}

PeriodoAcademico.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    fecha_inicio: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fecha_fin: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    estado: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'periodos_academicos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default PeriodoAcademico;