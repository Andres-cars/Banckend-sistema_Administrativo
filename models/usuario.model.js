// src/models/usuario.model.js
import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import bcrypt from 'bcrypt';
import Role from './role.model.js';
import Docente from './docente.model.js';

class Usuario extends Model {
  // Método para comparar contraseñas
  async comparePassword(password) {
    return bcrypt.compare(password, this.password);
  }
}

Usuario.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    rol_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id',
      },
    },
    usuario: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 100],
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    docente_id: {  
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    estado: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'usuarios',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      // 🔐 Cifrar contraseña antes de crear
      beforeCreate: async (usuario) => {
        if (usuario.password) {
          const salt = await bcrypt.genSalt(10);
          usuario.password = await bcrypt.hash(usuario.password, salt);
        }
      },
      // 🔐 Cifrar contraseña antes de actualizar
      beforeUpdate: async (usuario) => {
        if (usuario.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          usuario.password = await bcrypt.hash(usuario.password, salt);
        }
      },
    },
  }
);

// Relaciones
Usuario.belongsTo(Role, { foreignKey: 'rol_id', as: 'rol' });
Usuario.belongsTo(Docente, { foreignKey: 'docente_id', as: 'docente' });

Role.hasMany(Usuario, { foreignKey: 'rol_id', as: 'usuarios' });
Docente.hasOne(Usuario, { foreignKey: 'docente_id', as: 'usuario' });


export default Usuario;