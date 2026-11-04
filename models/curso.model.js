// models/curso.model.js
import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import Aula from './aula.model.js';

class Curso extends Model {
  get nombreCompleto() {
    return `${this.nivel} ${this.grado} "${this.paralelo}"`;
  }
}

Curso.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    nivel: { type: DataTypes.STRING(100), allowNull: false },
    grado: { type: DataTypes.STRING(50), allowNull: false },
    paralelo: { type: DataTypes.STRING(10), allowNull: false },
    tipo_educacion: { 
      type: DataTypes.ENUM('BASICA', 'BACHILLERATO', 'ESCUELA'), // ESCUELA: Inicial a 7mo 
      defaultValue: 'BASICA' 
    },
    aula_id: { // ✅ NUEVO CAMPO
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    estado: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    tableName: 'cursos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);
Curso.belongsTo(Aula, { foreignKey: 'aula_id', as: 'aula' });
export default Curso;