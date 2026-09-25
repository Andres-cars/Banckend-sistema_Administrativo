// models/disponibilidad.model.js
import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import Docente from './docente.model.js';

class Disponibilidad extends Model {}

Disponibilidad.init(
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
    dia_semana: {
      type: DataTypes.ENUM('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'),
      allowNull: false,
    },
    hora_inicio: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    hora_fin: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    disponible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'disponibilidades',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

// Relaciones
Disponibilidad.belongsTo(Docente, { foreignKey: 'docente_id', as: 'docente' });
Docente.hasMany(Disponibilidad, { foreignKey: 'docente_id', as: 'disponibilidades' });

export default Disponibilidad;