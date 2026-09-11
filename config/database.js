// src/config/database.js
import { Sequelize } from 'sequelize';
import {
  DB_CONNECTION,
  DB_USERNAME,
  DB_PASSWORD,
  DB_HOST,
  DB_DATABASE,
  NODE_ENV
} from './config.js';

export const sequelize = new Sequelize(
  DB_DATABASE,
  DB_USERNAME,
  DB_PASSWORD,
  {
    host: DB_HOST,
    dialect: DB_CONNECTION,
    port: parseInt(process.env.DB_PORT || '3306'),
    logging: NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: false,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a MySQL establecida correctamente.');
    console.log(`📊 Base de datos: ${DB_DATABASE}`);
  } catch (error) {
    console.error('❌ Error al conectar con MySQL:', error);
  }
};