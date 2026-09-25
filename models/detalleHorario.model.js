// models/detalleHorario.model.js
import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import Horario from './horario.model.js';
import CargaHoraria from './cargaHoraria.model.js';
import Aula from './aula.model.js';

class DetalleHorario extends Model {}

DetalleHorario.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    horario_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    carga_horaria_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    aula_id: {
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
  },
  {
    sequelize,
    tableName: 'detalle_horarios',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

// Relaciones
DetalleHorario.belongsTo(Horario, { foreignKey: 'horario_id', as: 'horario' });
DetalleHorario.belongsTo(CargaHoraria, { foreignKey: 'carga_horaria_id', as: 'carga_horaria' });
DetalleHorario.belongsTo(Aula, { foreignKey: 'aula_id', as: 'aula' });

Horario.hasMany(DetalleHorario, { foreignKey: 'horario_id', as: 'detalles' });

export default DetalleHorario;