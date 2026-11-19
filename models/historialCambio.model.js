// models/historialCambio.model.js
// ✅ RN-12: historial de cambios (qué se cambió, quién lo hizo y cuándo)
import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import Usuario from './usuario.model.js';

class HistorialCambio extends Model {}

HistorialCambio.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    usuario_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    tabla: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    registro_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    accion: {
      type: DataTypes.ENUM('CREAR', 'EDITAR', 'ELIMINAR', 'PUBLICAR', 'RETIRAR'),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'historial_cambios',
    timestamps: false, // la tabla solo tiene "fecha"
  }
);

HistorialCambio.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

export default HistorialCambio;