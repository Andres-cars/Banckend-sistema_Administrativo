// src/routes/auth.routes.js
import { Router } from 'express';
import {
  login,
  logout,
  getProfile,
} from '../controller/auth.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Rutas públicas
router.post('/login', login);
router.post('/logout', logout);

// Ruta protegida (requiere token)
router.get('/profile', verifyToken, getProfile);

export default router;