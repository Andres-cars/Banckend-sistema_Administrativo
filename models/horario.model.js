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
    // ✅ A2.5 / HU-14: escenario del horario (por ahora todos 'General')
    escenario: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'General',
    },
    generado_automaticamente: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    estado: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    // ✅ HU-13: solo los horarios publicados los ven los docentes
    publicado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    fecha_publicacion: {
      type: DataTypes.DATE,
      allowNull: true,
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