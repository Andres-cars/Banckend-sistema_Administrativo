// src/routes/curso.routes.js
import { Router } from 'express';
import {
  getAll,
  getById,
  create,
  update,
  deleteCurso,
  search,
} from '../controller/curso.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { isAdmin } from '../middlewares/role.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Rutas para administradores
router.get('/', isAdmin, getAll);
router.get('/search', isAdmin, search);
router.get('/:id', isAdmin, getById);
router.post('/', isAdmin, create);
router.put('/:id', isAdmin, update);
router.delete('/:id', isAdmin, deleteCurso);

export default router;