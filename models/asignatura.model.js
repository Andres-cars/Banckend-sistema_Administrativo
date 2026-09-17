// src/models/asignatura.model.js
import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

class Asignatura extends Model {}

Asignatura.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    codigo: {
      type: DataTypes.STRING(30),
      allowNull: true,
      unique: true,
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
    tableName: 'asignaturas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Asignatura;