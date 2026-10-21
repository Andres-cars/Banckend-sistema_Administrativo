// router/admin.routes.js
import { Router } from 'express';
import {
  getAll,
  getById,
  create,
  update,
  deleteAdmin,
} from '../controller/admin.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { isAdmin } from '../middlewares/role.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);
router.use(isAdmin); // Solo administradores pueden gestionar administradores

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', deleteAdmin);

export default router;