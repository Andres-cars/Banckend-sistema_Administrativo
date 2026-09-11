// src/models/docente.model.js
import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

class Docente extends Model {
  // Getter para nombre completo
  get nombreCompleto() {
    return `${this.nombres} ${this.apellidos}`;
  }
}

Docente.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    nombres: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100],
      },
    },
    apellidos: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100],
      },
    },
    identificacion: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
      validate: {
        len: [0, 20],
      },
    },
    especialidad: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    estado: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'docentes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Docente;