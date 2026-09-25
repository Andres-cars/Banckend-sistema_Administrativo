// models/horario.model.js
import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import PeriodoAcademico from './periodoAcademico.model.js';
import Jornada from './jornada.model.js';

class Horario extends Model {}

Horario.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    periodo_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    jornada_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    generado_automaticamente: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    estado: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'horarios',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

// Relaciones
Horario.belongsTo(PeriodoAcademico, { foreignKey: 'periodo_id', as: 'periodo' });
Horario.belongsTo(Jornada, { foreignKey: 'jornada_id', as: 'jornada' });

export default Horario;