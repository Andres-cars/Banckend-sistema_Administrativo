// src/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';
import { syncDatabase } from './models/index.js';

// IMPORTAR RUTAS
import authRoutes from './router/auth.routes.js';
import docenteRoutes from './router/docente.routes.js';
import cursoRoutes from './router/curso.routes.js';
// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARES
// ============================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// RUTAS
// ============================================

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    name: 'Sistema de Gestión Académica API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: {
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile',
      },
    },
  });
});

// Ruta de health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    database: 'MySQL'
  });
});

// ✅ RUTAS DE AUTENTICACIÓN
app.use('/api/auth', authRoutes);
app.use('/api/docentes', docenteRoutes);
app.use('/api/cursos', cursoRoutes);
// ============================================
// MANEJO DE ERRORES GLOBAL
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================
const startServer = async () => {
  try {
    // Probar conexión a MySQL
    await testConnection();

    // Sincronizar modelos con la base de datos
    await syncDatabase(false);

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('═══════════════════════════════════════');
      console.log('🚀 Servidor iniciado correctamente');
      console.log(`📡 Puerto: ${PORT}`);
      console.log(`🌐 http://localhost:${PORT}`);
      console.log(`🔍 Health: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Login: POST http://localhost:${PORT}/api/auth/login`);
      console.log('═══════════════════════════════════════');
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();