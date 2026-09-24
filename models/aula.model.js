// src/models/aula.model.js
import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

class Aula extends Model {}

Aula.init(
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
    capacidad: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      validate: {
        min: 1,
      },
    },
    tipo: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    estado: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'aulas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Aula;