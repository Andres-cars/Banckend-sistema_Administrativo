// src/models/curso.model.js
import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

class Curso extends Model {
  // Getter para nombre completo
  get nombreCompleto() {
    return `${this.nivel} ${this.grado} "${this.paralelo}"`;
  }
}

Curso.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    nivel: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    grado: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    paralelo: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    estado: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'cursos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Curso;