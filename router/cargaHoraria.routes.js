// src/routes/cargaHoraria.routes.js
import { Router } from 'express';
import {
  getAll,
  getById,
  create,
  update,
  deleteCarga,
  getByDocente,
  getByCurso,
} from '../controller/cargaHoraria.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { isAdmin } from '../middlewares/role.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Rutas para administradores
router.get('/', isAdmin, getAll);
router.get('/docente/:docenteId', isAdmin, getByDocente);
router.get('/curso/:cursoId', isAdmin, getByCurso);
router.get('/:id', isAdmin, getById);
router.post('/', isAdmin, create);
router.put('/:id', isAdmin, update);
router.delete('/:id', isAdmin, deleteCarga);

export default router;