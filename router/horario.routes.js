// src/routes/horario.routes.js
import { Router } from 'express';
import {
  generar,
  guardar,
  getAll,
  getById,
  deleteHorario,
} from '../controller/horario.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { isAdmin } from '../middlewares/role.middleware.js';

const router = Router();

router.use(verifyToken);

// Rutas para administradores
router.post('/generar', isAdmin, generar);
router.post('/guardar', isAdmin, guardar);
router.get('/', isAdmin, getAll);
router.get('/:id', isAdmin, getById);
router.delete('/:id', isAdmin, deleteHorario);

export default router;