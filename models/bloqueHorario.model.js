// models/bloqueHorario.model.js
import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

class BloqueHorario extends Model {}

BloqueHorario.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    tipo_educacion: { type: DataTypes.ENUM('BASICA', 'BACHILLERATO'), allowNull: false },
    orden: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    hora_inicio: { type: DataTypes.TIME, allowNull: false },
    hora_fin: { type: DataTypes.TIME, allowNull: false },
    tipo: { type: DataTypes.ENUM('CLASE', 'RECREO', 'ALMUERZO'), defaultValue: 'CLASE' },
    estado: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    tableName: 'bloques_horarios',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default BloqueHorario;