// models/usuario.model.js
import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import bcrypt from 'bcrypt';
import Role from './role.model.js';
import Docente from './docente.model.js';

class Usuario extends Model {
  async comparePassword(password) {
    return bcrypt.compare(password, this.password);
  }
}

Usuario.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    rol_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    usuario: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(255), allowNull: false },
    docente_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    estado: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    tableName: 'usuarios',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeCreate: async (usuario) => {
        // ✅ Verificar que NO esté ya cifrada (empieza con $2b$)
        if (usuario.password && !usuario.password.startsWith('$2b$')) {
          const salt = await bcrypt.genSalt(10);
          usuario.password = await bcrypt.hash(usuario.password, salt);
        }
      },
      beforeUpdate: async (usuario) => {
        if (usuario.changed('password') && !usuario.password.startsWith('$2b$')) {
          const salt = await bcrypt.genSalt(10);
          usuario.password = await bcrypt.hash(usuario.password, salt);
        }
      },
    },
  }
);

Usuario.belongsTo(Role, { foreignKey: 'rol_id', as: 'rol' });
Usuario.belongsTo(Docente, { foreignKey: 'docente_id', as: 'docente' });
Role.hasMany(Usuario, { foreignKey: 'rol_id', as: 'usuarios' });
Docente.hasOne(Usuario, { foreignKey: 'docente_id', as: 'usuario' });

export default Usuario;