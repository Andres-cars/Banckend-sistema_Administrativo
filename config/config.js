// src/config/config.js
import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 3000;
export const NODE_ENV = process.env.NODE_ENV || 'development';

export const DB_CONNECTION = process.env.DB_CONNECTION || 'mysql';
export const DB_HOST = process.env.DB_HOST || 'localhost';
export const DB_PORT = process.env.DB_PORT || 3306;
export const DB_DATABASE = process.env.DB_DATABASE || 'gestion_academica';
export const DB_USERNAME = process.env.DB_USERNAME || 'root';
export const DB_PASSWORD = process.env.DB_PASSWORD || '';

export const TOKEN_KEY = process.env.TOKEN_KEY || 'secret';
export const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h';

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;