// router/periodo.routes.js
// ✅ Periodos académicos
import { Router } from 'express';
import {
  getAll,
  getActual,
  getById,
  create,
  update,
  cambiarEstado,
} from '../controller/periodo.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { isAdmin } from '../middlewares/role.middleware.js';

const router = Router();

// Todas las rutas requieren iniciar sesión
router.use(verifyToken);

// Consultar: cualquier usuario autenticado (el docente necesita saber el periodo actual)
router.get('/', getAll);
router.get('/actual', getActual); // ⚠️ antes de '/:id'
router.get('/:id', getById);

// Modificar: solo administradores
router.post('/', isAdmin, create);
router.put('/:id', isAdmin, update);
router.patch('/:id/estado', isAdmin, cambiarEstado);

export default router;